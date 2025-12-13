
import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import dotenv from 'dotenv';
import { Op, Sequelize } from 'sequelize';
import { checkUserApiKey, getCurrency } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import db from '../_config/db.js';
import UserModel from '../_models/users.js';
import CustomerModel from '../_models/customers.js';
import ProductModel from '../_models/product.js';
import WalletModel from '../_models/wallet.js';
import OfferModel from '../_models/offers.js';
import OrderModel from '../_models/order.js'
import dayjs from 'dayjs';
import { calculateProductDetails } from '../_helpers/services/productCalculationService.js';
import UserAddress from '../_models/userAddress.js';

import RazorpayApi from '../_helpers/services/RazorpayApi.js';
import CCAvenueGateway from '../_helpers/services/CCAvenueGateway.js';
import PhonePeGateway from  '../_helpers/services/PhonePeGateway.js';
import CashfreeGateway from '../_helpers/services/CashfreeGateway.js';
import PayuGateway from '../_helpers/services/PayUGateway.js';
import { processPaymentUpdate } from '../_helpers/services/walletPaymentService.js';
import OrderProductModel from '../_models/order_products.js';

import { constants, CURRENCY } from "../_config/constants.js";

dotenv.config();
const router = express.Router();
const upload = multer();

function newSequenceCode(prefix = 'ORD') {
  const now = dayjs().format('YYYYMMDDHHmmss'); // e.g., 20250617123545
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // e.g., 4-digit random number
  return `${prefix}${now}${randomSuffix}`;
}

  function generateNDigitRandomNumber(n) {
    const min = Math.pow(10, n - 1);
    const max = Math.pow(10, n) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

const updateProductStock = async (order_id) => {
  try {
    // Find the order and its products
    const order = await OrderModel.findOne({
      where: { order_id: order_id },
      include: [{
        model: OrderProductModel,
        as: 'order_products',
        required: true
      }]
    });

    if (!order) {
      console.log(`Order not found: ${order_id}`);
      return false;
    }

    // Update stock for each product in the order
    for (const orderProduct of order.order_products) {
      const product = await ProductModel.findOne({ 
        where: { id: orderProduct.product_id } 
      });

      if (product) {
        await product.update({
          quantity: product.quantity - orderProduct.quality
        });
        console.log(`Updated stock for product ${product.id}: ${product.quantity} -> ${product.quantity - orderProduct.quality}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    return false;
  }
};

router.post('/productPurchase', upload.none(), async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log('[productPurchase] Request received');
    console.log('[productPurchase] Request body:', req.body ? Object.keys(req.body) : 'EMPTY');
    console.log('[productPurchase] Content-Type:', req.headers['content-type']);
    
    // Check if req.body exists and is not empty
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      console.error('[productPurchase] ERROR: Request body is empty or invalid');
      return res.status(400).json({ 
        status: 0, 
        msg: 'Request body is empty or invalid. Please check your request data and Content-Type header (should be application/x-www-form-urlencoded).' 
      });
    }

    // Joi validation schema with detailed error messages
    const schema = Joi.object({
      api_key: Joi.string().required().messages({
        'string.empty': 'API key is required',
        'any.required': 'API key is required'
      }),
      user_uni_id: Joi.string().required().messages({
        'string.empty': 'User ID is required',
        'any.required': 'User ID is required'
      }),
      item: Joi.any().required().messages({
        'any.required': 'Item quantity is required'
      }),
      vendor_uni_id: Joi.string().required().messages({
        'string.empty': 'Vendor ID is required',
        'any.required': 'Vendor ID is required'
      }),
      address_id: Joi.string().required().messages({
        'string.empty': 'Address ID is required',
        'any.required': 'Address ID is required'
      }),
      product_id: Joi.string().required().messages({
        'string.empty': 'Product ID is required',
        'any.required': 'Product ID is required'
      }),
      reference_id: Joi.string().optional().allow('', null),
      offer_code: Joi.string().optional().allow('', null),
      wallet_check: Joi.any().optional().allow('', null),
      payment_method: Joi.string().optional().allow('', null), // Allow empty string to use default gateway
      is_updated: Joi.string().optional().allow('', null),
    });

    // Validate request body with Joi
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all validation errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    // Handle validation errors
    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      console.error('[productPurchase] Validation error:', errorMessages);
      return res.status(400).json({ 
        status: 0, 
        msg: `Validation failed: ${errorMessages}` 
      });
    }

    // Check if value exists after validation
    if (!value || typeof value !== 'object') {
      console.error('[productPurchase] ERROR: Validation value is undefined or invalid');
      return res.status(500).json({ 
        status: 0, 
        msg: 'Internal server error: Validation failed. Please contact support.' 
      });
    }

    // Destructure validated values
    const { 
      api_key, 
      user_uni_id, 
      item, 
      vendor_uni_id, 
      address_id, 
      product_id, 
      reference_id, 
      offer_code, 
      wallet_check, 
      payment_method, 
      is_updated 
    } = value;

    // Validate required fields are not empty after destructuring
    if (!api_key || !user_uni_id || !vendor_uni_id || !address_id || !product_id) {
      console.error('[productPurchase] ERROR: Required fields are missing after validation');
      return res.status(400).json({ 
        status: 0, 
        msg: 'Required fields are missing: api_key, user_uni_id, vendor_uni_id, address_id, or product_id' 
      });
    }

    console.log('[productPurchase] Validation passed for user:', user_uni_id, 'product:', product_id);

    // Start main business logic
    try {
      const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
      if (!isAuthorized) {
        console.error('[productPurchase] Unauthorized user:', user_uni_id);
        return res.status(401).json({ status: 0, msg: 'Unauthorized User... Please login again' });
      }

      const currencyInfo = await getCurrency(user_uni_id, 'all');
     const default_currency_code = CURRENCY.default_currency_code;
     
      if(currencyInfo.currency_code !== default_currency_code){
       return res.status(200).json({status:0, msg: 'This feature is not available for your country'});
      }

      const customerData = await CustomerModel.findOne({
  where: { customer_uni_id: user_uni_id },
  include: [{
    model: UserModel,
    as: 'user',
    required: true
  }]
});

let result = await calculateProductDetails(req.body);



const order_id = newSequenceCode('ORD');
const date = dayjs();
console.log(order_id);

if(address_id){

 const user_address = await UserAddress.findOne({
  where: {
    user_uni_id: user_uni_id,
    id: address_id
  }
});

if (!user_address) {
  return res.status(200).json({status:0, msg:'Please select correct address'});
}

} else {
 return res.status(200).json({status:0, msg:'Please select address'});
}

let where_from = 'web';
let product_order_status = 'pending';
let product_order_payment_status = 'paid';

const return_product_days = Number(getConfig('retrun_product_days') || 0);
let returnValidDate = '';


if (return_product_days > 0) {
  returnValidDate = date.add(return_product_days, 'day').format('YYYY-MM-DD');
} else {
  returnValidDate = date.add(14, 'day').format('YYYY-MM-DD');
}




if (result?.status == 1) {

let msg = "Payment Successfully";
let payment_gateway_status = 0;
let wallet_status = 1;
let gateway_order_id = '';
let payment_gateway_resp = '';


if (result?.data?.payable_amount && result.data.payable_amount > 0) {

  product_order_payment_status = 'unpaid';
  let payment_method = '';


  const user = await UserModel.findOne({ where: { user_uni_id } });

    

  if (req.body.payment_method) { 

    where_from = 'app';

    
   if (req.body.payment_method === 'razorpay') {

  payment_method = 'razorpay';

  const razorpay_id = await getConfig('razorpay_id');
  const logo = await getConfig('logo');




  const razorpayInstance = new RazorpayApi(); 
  const response = await razorpayInstance.createOrderId({
    amount: result.data.payable_amount,
    currency: 'INR',
  });



  if (response && response.orderId) {
    const paymentData = {
      phone: user.phone,
      amount: result.data.payable_amount,
      razorpay_id: razorpay_id,
      user_uni_id: user_uni_id,
      logo: logo,
      email: user.email || '',
      name: user.name || '',
      order_id: response.orderId,
    };

    payment_gateway_resp = paymentData;
    gateway_order_id = response.orderId;
  } else {
    const result = {
      status: 0,
      msg: 'Failed please try again',
    };
    return res.status(200).json(result);
  }
} else if (req.body.payment_method === 'CCAvenue') {
  payment_method = 'CCAvenue';
  gateway_order_id = generateNDigitRandomNumber(15);

  const parameters = {
    merchant_id: await getConfig('ccavenue_merchant_id'),
    currency: await getConfig('ccavenue_currency'),
    redirect_url: `${req.protocol}://${req.get('host')}/api/paymentresponseccavenueapp`,
    cancel_url: `${req.protocol}://${req.get('host')}/api/paymentresponseccavenueapp`,
    language: await getConfig('ccavenue_language'),
    order_id: gateway_order_id,
    amount: result.data.payable_amount,
    billing_name: user?.name || '',
    billing_tel: '',
    billing_email: '',
    merchant_param1: user_uni_id
  };

  payment_gateway_resp = parameters;
} else if (req.body.payment_method === 'PhonePe') {
  payment_method = 'PhonePe';
  gateway_order_id = 'ORD' + generateNDigitRandomNumber(12);

  const parameters = {
    merchantTransactionId: gateway_order_id,
    merchantUserId: user_uni_id,
    amount: result.data.payable_amount,
    redirectUrl: `${req.protocol}://${req.get('host')}/api/paymentresponsephonepeapp`,
    callbackUrl: `${req.protocol}://${req.get('host')}/api/paymentresponsephonepeapp`,
    redirectUrlWeb: `${req.protocol}://${req.get('host')}/api/paymentresponsephonepeappwebview`,
    callbackUrlWeb: `${req.protocol}://${req.get('host')}/api/paymentresponsephonepeappwebview`,
    mobileNumber: user?.phone || '',
    is_updated: req.body.is_updated ?? 0
  };

  payment_gateway_resp = parameters;
} else if (req.body.payment_method === 'Cashfree') {
  payment_method = 'Cashfree';

  const customerData = await CustomerModel.findOne({
    where: { customer_uni_id: user_uni_id },
    include: [{
      model: UserModel,
      as: 'user',
      required: true
    }]
  });

  let cust_phone = customerData?.user?.phone || '';
  if (cust_phone) cust_phone = cust_phone.slice(-10);

  gateway_order_id = 'order_' + generateNDigitRandomNumber(8);

  const returnUrl = `${req.protocol}://${req.get('host')}/api/paymentresponsecashfreeapp`;

  const parameters = {
    gateway_order_id,
    amount: result.data.payable_amount,
    returnUrl,
    notifyUrl: returnUrl,
    customer_id: user_uni_id,
    customer_phone: cust_phone,
    customer_name: customerData?.user?.name || '',
    customer_email: customerData?.user?.email || ''
  };

  payment_gateway_resp = parameters;
} else if (req.body.payment_method === 'Payu') {
  payment_method = 'Payu';

  const customerData = await CustomerModel.findOne({
    where: { customer_uni_id: user_uni_id },
    include: [{
      model: UserModel,
      as: 'user',
      required: true
    }]
  });

  let cust_phone = customerData?.user?.phone || '';
  if (cust_phone) cust_phone = cust_phone.slice(-10);

  gateway_order_id = 'ORD' + generateNDigitRandomNumber(8);

  const successURL = `${req.protocol}://${req.get('host')}/api/paymentresponsepayuapp`;
  const failureURL = successURL; // same in Laravel

  const parameters = {
    gateway_order_id,
    amount: result.data.payable_amount,
    successURL,
    failureURL,
    customer_id: user_uni_id,
    customer_phone: cust_phone,
    customer_name: customerData?.user?.name || '',
    customer_email: customerData?.user?.email || '',
    description: 'Product Purchase',
    is_updated: req.body?.is_updated || 0
  };

  payment_gateway_resp = parameters;
} else {
  return res.status(400).json({
    status:0,
    msg:'No Payment Gateway Available'
  })
}

  }  else {
    const payment_gateway = await getConfig('payment_gateway');

    if (payment_gateway === 'razorpay') {
  payment_method = 'razorpay';
  const razorpay_id = await getConfig('razorpay_id');
  const logo = await getConfig('logo');

  const RazorpayInstance = new RazorpayApi();
  const response = await RazorpayInstance.createOrderId({
    amount: result.data.payable_amount,
    currency: 'INR'
  });

  if (response?.status) {
    payment_gateway_resp = {
      phone: user.phone,
      amount: result.data.payable_amount,
      razorpay_id,
      user_uni_id,
      logo,
      email: user.email || '',
      name: user.name || '',
      order_id: response.orderId
    };
    gateway_order_id = response.orderId;
  } else {
    return {
      status: 0,
      msg: 'Failed please try again'
    };
  }

} else if (payment_gateway === 'CCAvenue') {
  payment_method = 'CCAvenue';
  gateway_order_id = generateNDigitRandomNumber(15);

  const merchant_id = await getConfig('ccavenue_merchant_id');
  const currency = await getConfig('ccavenue_currency');
  const language = await getConfig('ccavenue_language');
  const redirectUrl = `${req.protocol}://${req.get('host')}/api/productpurchaseresponse`;

  payment_gateway_resp = {
    merchant_id,
    currency,
    redirect_url: redirectUrl,
    cancel_url: redirectUrl,
    language,
    order_id: gateway_order_id,
    amount: result.data.payable_amount,
    billing_name: user.name || '',
    billing_tel: '',
    billing_email: '',
    merchant_param1: user_uni_id
  };

} else if (payment_gateway === 'PhonePe') {
  payment_method = 'PhonePe';
  gateway_order_id = 'ORD' + generateNDigitRandomNumber(12);
  const redirectUrl = `${req.protocol}://${req.get('host')}/api/productpurchaseresponse`;

  payment_gateway_resp = {
    merchantTransactionId: gateway_order_id,
    merchantUserId: user_uni_id,
    amount: result.data.payable_amount,
    redirectUrl,
    callbackUrl: redirectUrl,
    mobileNumber: user.phone
  };

} else if (payment_gateway === 'Cashfree') {
  payment_method = 'Cashfree';
  const customerData = await CustomerModel.findOne({
    where: { customer_uni_id: user_uni_id },
    include: [{
      model: UserModel,
      as: 'user',
      required: true
    }]
  });

  let cust_phone = customerData?.user?.phone || '';
  if (cust_phone) cust_phone = cust_phone.slice(-10);

  gateway_order_id = 'order_' + generateNDigitRandomNumber(8);
  const returnUrl = `${req.protocol}://${req.get('host')}/api/paymentresponsecashfreeapp`;

  payment_gateway_resp = {
    gateway_order_id,
    amount: result.data.payable_amount,
    returnUrl,
    notifyUrl: returnUrl,
    customer_id: user_uni_id,
    customer_phone: cust_phone,
    customer_name: customerData?.user?.name || '',
    customer_email: customerData?.user?.email || ''
  };

} else {
  return {
    status: 0,
    msg: 'No Payment Gateway Available'
  };
}

  }

  msg="Payment Gateway Request";
  payment_gateway_status=1;
  wallet_status =0;



const recharge_amount = Number((result.data.payable_amount - result.data.recharge_gst_value).toFixed(2));



const cutomerwalletamtadd = {
  reference_id: order_id,
  gateway_order_id: gateway_order_id,
  gateway_payment_id: '',
  user_uni_id: user_uni_id,
  transaction_code: 'add_wallet',
  wallet_history_description: `Wallet Add Amount by Customer Recharge on Product Purchase # RS. ${recharge_amount}`,
  transaction_amount: result.data.payable_amount,
  amount: recharge_amount,
  main_type: 'cr',
  gst_amount: result.data.recharge_gst_value,
  status: wallet_status,
  offer_status: 0,
  payment_method: payment_method,
  where_from: where_from,
};

 await WalletModel.create(cutomerwalletamtadd);

}

const order = {
  reference_id: req.body.reference_id || '',
  order_id: order_id,
  vendor_uni_id: vendor_uni_id,
  user_uni_id: user_uni_id,
  address_id: address_id,
  description: 'Product is dispatch',
  reference_amount: result.data.reference_amount,
  offer_amount: result.data.offer_ammount,
  sub_total_amount: result.data.subtotal,
  gst_amount: result.data.gstamount,
  gst_percent: result.data.gstvalue,
  total_amount: result.data.finalamount,
  status: product_order_status,
  payment_status: product_order_payment_status,
  return_valid_date: returnValidDate
};

await OrderModel.create(order);

const orderProduct = {
  product_id: product_id,
  order_id: order_id,
  price: result.data.subtotal,
  quality: result.data.item,
  total_amount: result.data.finalamount
};

await OrderProductModel.create(orderProduct);



if (payment_gateway_status === 0) {
  console.log("after check payment_gateway_status",payment_gateway_status);
  const productStock = await ProductModel.findOne({ where: { id: product_id } });

  console.log("befor purchase", productStock);

  if (productStock) {
    await productStock.update({
      quantity: productStock.quantity - result.data.item,
    });
  }
 console.log("after product purchase", productStock, productStock.quantity, result.data.item);
  
  return res.status(200).json({
    status:"Order placed successfully"
  })
 
}


const customerwallet = {
  user_uni_id: user_uni_id,
  reference_id: order_id,
  gateway_order_id: gateway_order_id,
  gateway_payment_id: '',
  transaction_code: 'remove_wallet_by_purchase_product',
  wallet_history_description: `Remove Amount by Purchase product # RS. ${result.data.finalamount}`,
  transaction_amount: result.data.finalamount,
  amount: result.data.finalamount,
  main_type: 'dr',
  offer_code: req.body.offer_code || '',
  status: wallet_status
};

await WalletModel.create(customerwallet);


const vendorwallet = {
  user_uni_id: vendor_uni_id,
  reference_id: order_id,
  gateway_order_id: gateway_order_id,
  gateway_payment_id: '',
  transaction_code: 'add_wallet_by_purchase_product',
  wallet_history_description: `Add Amount by Purchase product # RS. ${result.data.finalamount}`,
  transaction_amount: result.data.vendor_amount,
  astro_amount: result.data.reference_amount || 0,
  amount: result.data.vendor_amount,
  tds_amount: result.data.vendor_tds_amount,
  offer_amount: result.data.offer_ammount,
  main_type: 'cr',
  status: wallet_status,
  admin_amount: result.data.admin_amount
};

await WalletModel.create(vendorwallet);


if (req.body.reference_id && result.data.reference_amount > 0) {
  const astrowallet = {
    user_uni_id: req.body.reference_id,
    reference_id: order_id,
    gateway_order_id: gateway_order_id,
    gateway_payment_id: '',
    transaction_code: 'add_wallet_by_purchase_product_reference',
    wallet_history_description: `Add Amount by Purchase Product Reference # RS. ${result.data.finalamount}`,
    transaction_amount: result.data.reference_amount,
    amount: result.data.reference_amount,
    tds_amount: result.data.reference_tds_amount,
    main_type: 'cr',
    status: wallet_status,
  };

  await WalletModel.create(astrowallet);
}



let data = '';
if (result.data) {
  data = result.data;
}


if (payment_gateway_status === 0) {
  console.log(" payment 0", data, payment_gateway_status);
  result = {
    status: 1,
    order_id: order_id,
    payment_gateway_status: payment_gateway_status,
    msg: msg,
    data: data,
  };
} else {
   console.log(" payment 1", data, payment_gateway_status);
  result = {
    status: 1,
    order_id: order_id,
    payment_gateway_status: payment_gateway_status,
    payment_gateway: payment_gateway_resp,
    msg: msg,
    data: data,
  };
}


if (result) {

  if (result.status === 1 && result.payment_gateway_status === 0) {
      console.log("payment 0 result i am here", result.payment_gateway_status);
    const order = await Api.getProductOrderDetail(result.order_id);

    await MyCommand.SendNotification(order.user_uni_id, 'product-order', 'product-order', order);
    await MyCommand.SendNotification(order.vendor_uni_id, 'vendor-product-order', 'vendor-product-order', order);
    await MyCommand.SendNotificationToAdmin('admin-product-order', order);

  } else if (result.status === 1 && result.payment_gateway_status === 1) {
    const paymentMethod = req.body.payment_method;
   console.log("payment 1 ", result.payment_gateway_status);
    if (paymentMethod === 'razorpay') {
      // Add razorpay post-gateway logic if needed

    } else if (paymentMethod === 'CCAvenue') {
      const ccavenueGateway = new CCAvenueGateway();
      const ccavenueRequest = await ccavenueGateway.request(result.payment_gateway);
      const enc_val = ccavenueRequest?.encRequest || '';

      if (enc_val) {
        const ccavenue_data = {
          order_id: result.order_id,
          access_code: await getConfig('ccavenue_access_code'),
          redirect_url: `${req.protocol}://${req.get('host')}/api/paymentresponseccavenueapp`,
          cancel_url: `${req.protocol}://${req.get('host')}/api/paymentresponseccavenueapp`,
          enc_val: enc_val,
          merchant_id: await getConfig('ccavenue_merchant_id'),
          working_key: await getConfig('ccavenue_working_key'),
          currency: await getConfig('ccavenue_currency'),
          language: await getConfig('ccavenue_language'),
        };
        result.ccavenue_data = ccavenue_data;
      } else {
        result.status = 0;
        result.msg = 'Something went Wrong on payment gateway. Please Try Again';
      }

    } else if (paymentMethod === 'PhonePe') {
      const phonepeGateway = new PhonePeGateway();
      const phonepe_data = await phonepeGateway.requestApp(result.payment_gateway);

      if (phonepe_data?.status === 1) {
        phonepe_data.order_id = result.order_id;
        result.phonepe_data = phonepe_data;
      } else {
        result.status = 0;
        result.msg = 'Something went Wrong on payment gateway. Please Try Again';
      }

    } else if (paymentMethod === 'Cashfree') {
      const cashfreeGateway = new CashfreeGateway();
      const cashfree_data = await cashfreeGateway.request(result.payment_gateway);

      if (cashfree_data?.status === 1) {
        result.cashfree_data = cashfree_data;
      } else {
        result.status = 0;
        result.msg = 'Something went Wrong on payment gateway. Please Try Again';
      }

    } else if (paymentMethod === 'Payu') {
      const payUGateway = new PayuGateway();
      const payu_data = await payUGateway.generatePaymentLink(result.payment_gateway);

      if (payu_data?.status === 1) {
        result.payu_data = payu_data;
      } else {
        result.status = 0;
        result.msg = 'Something went Wrong on payment gateway. Please Try Again';
      }
    }
  }
}

return res.status(200).json({
  status:1,
  order_id:result.order_id,
  payment_gateway_status:result.payment_gateway_status,
  payment_gateway:result.payment_gateway,
  msg,
  data,
  customerData: {
      ...customerData.toJSON(),
      ...customerData.user?.toJSON(), // merge user fields
      user: undefined, // remove nested `user` after merge
      customer_img: customerData.customer_img || "https://astro.synilogictech.com/assets/img/customer.png",
    }
  })

} else {
return res.status(200).json({
  status:0,
  order_id:'',
  msg:'Failed please try agian2'
})
}


    } catch (err) {
      // Log detailed error information for debugging
      console.error('[productPurchase] ERROR:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        user_uni_id: user_uni_id || 'unknown',
        product_id: product_id || 'unknown'
      });
      
      // Return detailed error response
      return res.status(500).json({ 
        status: 0, 
        msg: `Internal server error: ${err.message || 'Something went wrong. Please try again.'}`,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined // Only show error in development
      });
    }
  } catch (outerError) {
    // Catch any errors in validation or setup phase
    console.error('[productPurchase] OUTER ERROR:', {
      message: outerError.message,
      stack: outerError.stack,
      name: outerError.name,
      body: req.body ? Object.keys(req.body) : 'empty'
    });
    
    return res.status(500).json({ 
      status: 0, 
      msg: `Request processing error: ${outerError.message || 'Invalid request format or server error. Please check your request data.'}`,
      error: process.env.NODE_ENV === 'development' ? outerError.message : undefined
    });
  }
});

router.post('/razorpayresponse', upload.none(), express.raw({ type: '*/*' }), async (req, res) => {
  try {
    // ... existing signature verification code ...

    if (razorpay_response.order_id) {
      razorpay_response.order_status =
        event === 'payment.captured' ? 'Success' : 'Failed';
        console.log('wallet recharge',razorpay_response.order_status);

      // Add stock management for product orders
      if (razorpay_response.order_status === 'Success') {
          console.log('product purchase',razorpay_response.order_status);
        await updateProductStock(razorpay_response.order_id);
      }
    }

    return res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(200).json({ status: 'failed' });
  }
});

export default router;
