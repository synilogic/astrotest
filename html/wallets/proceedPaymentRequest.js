import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import db from "../_config/db.js";
import "../_models/index.js";
import WalletModel from '../_models/wallet.js';
import UserModel from '../_models/users.js';
import CustomerModel from '../_models/customers.js';
import CurrencyModel from '../_models/currencies.js';
import RechargeVoucherModel from '../_models/recharge_vouchers.js';
import { checkUserApiKey, getCurrency } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import { Op } from 'sequelize';
import RazorpayApi from '../_helpers/services/RazorpayApi.js';
import CCAvenueGateway from '../_helpers/services/CCAvenueGateway.js';
import PhonePeGateway from  '../_helpers/services/PhonePeGateway.js';
import CashfreeGateway from '../_helpers/services/CashfreeGateway.js';
import PayuGateway from '../_helpers/services/PayUGateway.js';
import { processPaymentUpdate } from '../_helpers/services/walletPaymentService.js';
import { processPaidKundliPaymentUpdate } from '../_helpers/services/paidKundliPaymentService.js';
import ProductModel from '../_models/product.js';
import OrderModel from '../_models/order.js';
import OrderProductModel from '../_models/order_products.js';

import moment from 'moment';



dotenv.config();
const router = express.Router();
const upload = multer();

const isRecharged = async (user_uni_id) => {
  try {
    const wallet = await WalletModel.findOne({
      where: {
        user_uni_id,
        transaction_code: 'add_wallet',
        status: { [Op.in]: [0, 1] }
      }
    });
    return !!wallet;
  } catch (error) {
    console.error("Error in isRecharged:", error);
    return false;
  }
};

  function generateNDigitRandomNumber(n) {
    const min = Math.pow(10, n - 1);
    const max = Math.pow(10, n) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

function getPaymentStatusMessage(status) {
  switch (status) {
    case 'Success': return 'Payment successful';
    case 'Failure': return 'Payment failed';
    case 'Aborted': return 'Payment was aborted';
    default: return 'Unknown payment status';
  }
};


const updateProductStock = async (order_id) => {
  console.log('📦 Starting product stock update for order:', order_id);
  
  try {
    // Find the order and its products
    console.log('�� Finding order with products...');
    const order = await OrderModel.findOne({
      where: { order_id: order_id },
      include: [{
        model: OrderProductModel,
        as: 'order_products',
        required: true
      }]
    });

    if (!order) {
      console.log('❌ Order not found:', order_id);
      return false;
    }

    console.log('📋 Order found:', {
      orderId: order.order_id,
      totalAmount: order.total_amount,
      status: order.status,
      productCount: order.order_products?.length || 0
    });

    // Update stock for each product in the order
    for (const orderProduct of order.order_products) {
      console.log('�� Processing product:', {
        productId: orderProduct.product_id,
        quantity: orderProduct.quality,
        price: orderProduct.price
      });

      const product = await ProductModel.findOne({ 
        where: { id: orderProduct.product_id } 
      });

      if (product) {
        const oldQuantity = product.quantity;
        const newQuantity = product.quantity - orderProduct.quality;
        
        console.log('📦 Updating product stock:', {
          productId: product.id,
          productName: product.name,
          oldQuantity: oldQuantity,
          newQuantity: newQuantity,
          reduction: orderProduct.quality
        });

        await product.update({
          quantity: newQuantity
        });
        
        console.log('✅ Product stock updated successfully:', {
          productId: product.id,
          oldQuantity: oldQuantity,
          newQuantity: newQuantity
        });
      } else {
        console.log('⚠️ Product not found:', orderProduct.product_id);
      }
    }

    console.log('✅ All product stock updates completed for order:', order_id);
    return true;
  } catch (error) {
    console.error('💥 Error updating product stock:', {
      error: error.message,
      stack: error.stack,
      orderId: order_id,
      timestamp: new Date().toISOString()
    });
    return false;
  }
};

router.post("/proceedPaymentRequest", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    payment_method: Joi.string().required(),
    amount: Joi.number().optional().allow(null),
    wallet_id: Joi.number().required(),
    is_updated: Joi.boolean().optional().allow(null)
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      status: 0,
      message: "Validation failed",
      errors: error.details,
      msg: error.details.map(e => e.message).join('\n')
    });
  }

  const { api_key, user_uni_id, payment_method, wallet_id, is_updated } = req.body;

  // Normalize payment_method to handle case variations
  const normalizedPaymentMethod = payment_method ? payment_method.trim() : '';
  console.log('🔍 Payment Gateway Mapping:', {
    received: payment_method,
    normalized: normalizedPaymentMethod,
    availableGateways: ['razorpay', 'PhonePe', 'CCAvenue', 'Cashfree', 'Payu', 'PayTm']
  });

  try {
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

    const customerData = await CustomerModel.findOne({
      where: { customer_uni_id: user_uni_id },
      include: [{ model: UserModel, as: 'user', required: true }]
    });

    const rechargeData = await RechargeVoucherModel.findOne({ where: { id: wallet_id } });

    if (!rechargeData) {
      return res.status(404).json({ status: 0, msg: 'Invalid Wallet CMS Id' });
    }

    const is_recharged = await isRecharged(user_uni_id);
    const tag = rechargeData?.tag;
    if (is_recharged && tag === 'new') {
      return res.status(400).json({ status: 0, msg: 'You have already recharged this offer' });
    }

    const gstRate = parseFloat(await getConfig('gst') || 0);
    const transaction_amount = parseFloat(rechargeData.wallet_amount);
    const gstcalc = (transaction_amount * gstRate) / 100;
    const totalamount = gstcalc + transaction_amount;

    if (!totalamount || totalamount === 0) {
      return res.status(400).json({ status: 0, msg: 'Recharge amount is required' });
    }

    const currencyInfo = await getCurrency(user_uni_id, 'all');
    const { currency_code, currency_symbol, exchange_rate = 1 } = currencyInfo;

    const offerStatus = await getConfig('offer_ammount_status');
    const gift_amount = parseFloat(rechargeData.gift_amount) || 0;
    const wallet_amount = offerStatus ? transaction_amount : transaction_amount + gift_amount;

    const inr_totalamount = parseFloat((totalamount * exchange_rate).toFixed(2));
    const inr_wallet_amount = parseFloat((wallet_amount * exchange_rate).toFixed(2));
    const inr_gstcalc = parseFloat((gstcalc * exchange_rate).toFixed(2));
    const inr_gift_amount = parseFloat((gift_amount * exchange_rate).toFixed(2));
    const inr_coupan_amount = 0;

    let orderDetail_wallet = null;
    let orderDetail_gift = null;

    if (inr_wallet_amount) {
      orderDetail_wallet = await WalletModel.create({
        user_uni_id,
        reference_id: wallet_id,
        gateway_payment_id: '',
        transaction_code: 'add_wallet',
        wallet_history_description: `Wallet Add Amount by Customer Recharge # ${currency_symbol} ${wallet_amount}`,
        transaction_amount: inr_totalamount,
        amount: inr_wallet_amount,
        main_type: 'cr',
        status: 0,
        offer_status: 0,
        currency: currency_code,
        gst_amount: inr_gstcalc,
        coupan_amount: inr_coupan_amount,
        payment_method,
        where_from: 'app',
        currency_code,
        currency_symbol,
        exchange_rate
      });
    }

    if (inr_gift_amount) {
      orderDetail_gift = await WalletModel.create({
        user_uni_id,
        reference_id: wallet_id,
        gateway_payment_id: '',
        transaction_code: 'add_wallet_voucher_gift',
        wallet_history_description: `Wallet Add Amount by Customer Gift # ${currency_symbol} ${gift_amount}`,
        transaction_amount: 0,
        amount: inr_gift_amount,
        main_type: 'cr',
        status: 0,
        offer_status: 1,
        currency: currency_code,
        coupan_amount: inr_coupan_amount,
        payment_method,
        where_from: 'app',
        currency_code,
        currency_symbol,
        exchange_rate
      });
    }

    if (!orderDetail_wallet) {
      return res.status(500).json({ status: 0, msg: 'Something went wrong. Please try again.' });
    }

    // Use normalized payment method for matching
    const paymentMethod = normalizedPaymentMethod;
    
    if (paymentMethod === 'PayTm' || paymentMethod.toLowerCase() === 'paytm') {
      // TODO: Handle PayTm logic
      console.log('⚠️ PayTm payment method not implemented yet');
      return res.status(400).json({ status: 0, msg: 'PayTm payment method is not supported yet' });
    } else if (paymentMethod === 'razorpay' || paymentMethod.toLowerCase() === 'razorpay') {
      const RazorpayInstance = new RazorpayApi();
      const response = await RazorpayInstance.createOrderId({
        amount: totalamount,
        currency: currency_code
      });

      if (response && response.orderId) {
        await orderDetail_wallet.update({ gateway_order_id: response.orderId });
        if (orderDetail_gift) {
          await orderDetail_gift.update({ gateway_order_id: response.orderId });
        }

        const razorpay_id = await getConfig('razorpay_id');
        const logo = await getConfig('logo');

         return res.status(200).json({
  status: 1,
  msg: 'Recharge Request successfully.',
  data: {
...rechargeData.toJSON(),
    order_id: response.orderId || '',
    amount: inr_totalamount,
    razorpay_id: razorpay_id,
    logo: logo,
    phone: customerData.user.phone || '',
    user_uni_id: customerData.user.user_uni_id || '',
    email: customerData.user.email || '',
    name: customerData.user.name || '',
    customerData: {
      ...customerData.toJSON(),
      ...customerData.user?.toJSON(), // merge user fields
      user: undefined, // remove nested `user` after merge
      customer_img: customerData.customer_img || "https://astro.synilogictech.com/assets/img/customer.png",
    }
  }
});
    

      } else {
        return res.status(500).json({ status: 0, msg: response?.msg || 'Razorpay order creation failed' });
      }
    } else if (paymentMethod === 'CCAvenue' || paymentMethod.toLowerCase() === 'ccavenue') {
  let cust_phone = customerData.user.phone || '';
  if (cust_phone) cust_phone = cust_phone.slice(-10);
  let cust_email = customerData.user.email || '';

  const gateway_order_id = generateNDigitRandomNumber(15);
  const merchant_id = await getConfig('ccavenue_merchant_id');
  const currency = await getConfig('ccavenue_currency');
  const language = await getConfig('ccavenue_language');
  const access_code = await getConfig('ccavenue_access_code');
  const working_key = await getConfig('ccavenue_working_key');

  const redirectUrl = `${req.protocol}://${req.get('host')}/api/paymentresponseccavenueapp`;

  const parameters = {
    merchant_id: merchant_id,
    currency: currency,
    redirect_url: redirectUrl,
    cancel_url: redirectUrl,
    language: language,
    order_id: gateway_order_id,
    amount: totalamount,
    billing_name: customerData.user.name || '',
    billing_tel: cust_phone,
    billing_email: cust_email,
    merchant_param1: user_uni_id
  };

  const gateway = new CCAvenueGateway();
  await gateway.init();
  const ccavenueRequest = await gateway.request(parameters);

  let enc_val = ccavenueRequest?.encRequest || '';
  if (enc_val !== '') {
    const ccavenue_data = {
      order_id: gateway_order_id,
      access_code,
      redirect_url: redirectUrl,
      cancel_url: redirectUrl,
      enc_val,
      merchant_id,
      working_key,
      currency,
      language
    };


    await orderDetail_wallet.update({ gateway_order_id });
    if (orderDetail_gift) {
      await orderDetail_gift.update({ gateway_order_id });
    }

    const data = {
     ...rechargeData.toJSON(),
      order_id: gateway_order_id.toString(),
      amount: totalamount.toString(),
      customerData: {
      ...customerData.toJSON(),
      ...customerData.user?.toJSON(), // merge user fields
      user: undefined, // remove nested `user` after merge
      customer_img: customerData.customer_img || "https://astro.synilogictech.com/assets/img/customer.png",
    }
    };

    
    return res.status(200).json({
      status: 1,
      msg: 'Recharge Request successfully.',
      ccavenue_data,
      data
    });
  } else {
    return res.status(400).json({
      status: 0,
      msg: 'Something went Wrong. Please Try Again'
    });
  }
    } else if (paymentMethod === 'PhonePe' || paymentMethod.toLowerCase() === 'phonepe') {
  console.log('✅ PhonePe Payment Method Matched:', {
    received: payment_method,
    normalized: normalizedPaymentMethod,
    paymentMethod: paymentMethod,
    matching: true
  });
  
  try {
    const custPhone = customerData?.user?.phone || '';
    const mobileNumber = custPhone ? custPhone.slice(-10) : '';

    const gatewayOrderId = `ORD${generateNDigitRandomNumber(13)}`;

    const redirectUrl = `${req.protocol}://${req.get('host')}/api/paymentresponsephonepeapp`;
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/paymentresponsephonepeapp`;

    const parameters = {
      merchantTransactionId: gatewayOrderId,
      merchantUserId: user_uni_id,
      amount: totalamount,
      redirectUrl: redirectUrl,
      callbackUrl: callbackUrl,
      mobileNumber: mobileNumber,
      is_updated: is_updated || 0
    };

    // Initialize PhonePe Gateway first
    const phonePeGateway = new PhonePeGateway();
    
    console.log("📞 PhonePe Payment Request:", {
      parameters: {
        ...parameters,
        amount: parameters.amount,
        merchantTransactionId: parameters.merchantTransactionId
      },
      merchantId: phonePeGateway.merchantId ? 'Configured' : 'Missing',
      testMode: phonePeGateway.testMode ? 'TEST' : 'LIVE'
    });

    const phonepe_response = await phonePeGateway.requestApp(parameters);

    console.log("📥 PhonePe Gateway Response:", {
      status: phonepe_response.status,
      msg: phonepe_response.msg,
      hasError: !!phonepe_response.error,
      errorCode: phonepe_response.error?.code,
      errorMessage: phonepe_response.error?.message
    });

    if (phonepe_response.status === 1) {
      // Update wallet order with gateway_order_id
      if (orderDetail_wallet?.update) {
        await orderDetail_wallet.update({ gateway_order_id: gatewayOrderId });
      }

      // If gift order exists, update it too
      if (orderDetail_gift?.update) {
        await orderDetail_gift.update({ gateway_order_id: gatewayOrderId });
      }

      const data = {
        ...rechargeData.toJSON(),
        order_id: String(gatewayOrderId),
        amount: String(totalamount),
        customerData: {
          ...customerData.toJSON(),
          ...customerData.user?.toJSON(),
          user: undefined,
          customer_img: customerData.customer_img || "https://astro.synilogictech.com/assets/img/customer.png",
        }
      };

      return res.status(200).json({
        status: 1,
        msg: 'Payment initiated successfully',
        phonepe_data: {
          ...phonepe_response.data,
          order_id: gatewayOrderId
        },
        data: data
      });

    } else {
      return res.status(400).json({
        status: 0,
        msg: phonepe_response.msg || 'Payment initiation failed',
        error: phonepe_response.error
      });
    }

  } catch (error) {
    console.error('PhonePe Error:', error);
    return res.status(500).json({
      status: 0,
      msg: 'PhonePe payment failed due to an internal error.',
      error: error.message
    });
  }
    } else if (paymentMethod === 'Cashfree' || paymentMethod.toLowerCase() === 'cashfree') {
  try {
   
    const custPhone = customerData?.user?.phone || '';
    const mobileNumber = custPhone ? custPhone.slice(-10) : '';
    
    const gatewayOrderId = `order_${generateNDigitRandomNumber(8)}`;
    
    // Cashfree requires HTTPS URLs - handle localhost and production
    let baseUrl = process.env.CASHFREE_CALLBACK_URL;
    
    if (!baseUrl) {
      // If no environment variable, construct from request
      const host = req.get('host');
      const protocol = req.protocol;
      
      // For localhost, use HTTPS (Cashfree requirement)
      // In production, use actual protocol
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        // For local development, you need to use ngrok or similar tool
        // Or set CASHFREE_CALLBACK_URL environment variable
        baseUrl = process.env.CASHFREE_CALLBACK_URL || 'https://your-ngrok-url.ngrok.io';
        console.warn('⚠️ Cashfree: Using localhost - HTTPS URL required. Set CASHFREE_CALLBACK_URL env variable or use ngrok.');
      } else {
        // Production - force HTTPS if not already
        baseUrl = protocol === 'https' ? `${protocol}://${host}` : `https://${host}`;
      }
    }
    
    const returnUrl = `${baseUrl}/api/paymentresponsecashfreeapp`;
    
    console.log('🔗 Cashfree Return URL:', {
      baseUrl,
      returnUrl,
      isHttps: returnUrl.startsWith('https://'),
      host: req.get('host'),
      protocol: req.protocol
    });
    
    const parameters = {
      gateway_order_id: gatewayOrderId,
      amount: parseFloat(totalamount), // Ensure it's a number
      returnUrl: returnUrl,
      notifyUrl: returnUrl,
      customer_id: customerData.user.user_uni_id || '',
      customer_phone: mobileNumber,
      customer_name: customerData?.name || '',
      customer_email: customerData?.email || '',
      currency: 'INR', // Add currency if not set elsewhere
      is_updated: is_updated || 0, // Ensure it has a default value
    };


    // Validate required parameters before making the request
    if (!parameters.gateway_order_id || !parameters.amount || parameters.amount <= 0) {
      console.error('Invalid parameters:', parameters);
      return res.status(400).json({
        status: 0,
        msg: 'Invalid order parameters. Please check order ID and amount.'
      });
    }

    const cashfree = new CashfreeGateway();
    const cashfree_data = await cashfree.request(parameters);
    
    console.log('Cashfree Response:', cashfree_data);
    
    if (cashfree_data.status === 1) {
      cashfree_data.order_id = gatewayOrderId;
      
      // Update orderDetail_wallet and orderDetail_gift (adjust with your DB logic)
      if (orderDetail_wallet) {
        await orderDetail_wallet.update({ gateway_order_id: gatewayOrderId });
        console.log('Updated orderDetail_wallet with gateway_order_id');
      }
      
      if (orderDetail_gift) {
        await orderDetail_gift.update({ gateway_order_id: gatewayOrderId });
        console.log('Updated orderDetail_gift with gateway_order_id');
      }
      
      const data = {
        ...rechargeData.toJSON(),
        order_id: gatewayOrderId.toString(),
        amount: totalamount.toString(),
        customerData: {
          ...customerData.toJSON(),
          ...customerData.user?.toJSON(), // merge user fields
          user: undefined, // remove nested `user` after merge
          customer_img: customerData.customer_img || "https://astro.synilogictech.com/assets/img/customer.png",
        }
      };
      
      return res.status(200).json({
        status: 1,
        msg: 'Recharge Request successful.',
        cashfree_data,
        data
      });
      
    } else {
      console.error('Cashfree payment failed:', cashfree_data.msg);
      return res.status(400).json({
        status: 0,
        msg: cashfree_data.msg || 'Payment gateway error. Please try again.'
      });
    }
    
  } catch (error) {
    console.error('Cashfree payment error:', error);
    return res.status(500).json({
      status: 0,
      msg: 'Internal server error. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
    } else if (paymentMethod === 'Payu' || paymentMethod.toLowerCase() === 'payu' || paymentMethod === 'PayU') {
  const custPhone = customerData?.user?.phone || '';
  const mobileNumber = custPhone ? custPhone.slice(-10) : '';

  const gatewayOrderId = `ORD${generateNDigitRandomNumber(8)}`;

  const parameters = {
    gateway_order_id: gatewayOrderId,
    amount: parseFloat(totalamount),
    successURL: `https://yourdomain.com/api/paymentresponse/payu`,
    failureURL: `https://yourdomain.com/api/paymentresponse/payu`,
    currency: currency_code,
    customer_id: customerData.user.user_uni_id || '',
    customer_phone: mobileNumber,
    customer_name: customerData?.name || '',
    customer_email: customerData?.email || '',
    is_updated: is_updated || 0,
  };

  const payUGateway = new PayuGateway();
  const payu_data = await payUGateway.generatePaymentLink(parameters);

  if (payu_data.status === 1) {
    payu_data.order_id = gatewayOrderId;

    // Update order entries
    if (orderDetail_wallet?.update) {
      await orderDetail_wallet.update({ gateway_order_id: gatewayOrderId });
    }

    if (orderDetail_gift?.update) {
      await orderDetail_gift.update({ gateway_order_id: gatewayOrderId });
    }

    const rechargeJson = rechargeData.toJSON?.() || rechargeData;

    const data = {
      id: rechargeJson.id,
      wallet_amount: rechargeJson.wallet_amount || '0.00',
      gift_amount: rechargeJson.gift_amount || '0.00',
      tag: rechargeJson.tag || '',
      currency_code: rechargeJson.currency_code || 'INR',
      status: rechargeJson.status || 1,
      created_at: moment(rechargeJson.created_at).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment(rechargeJson.updated_at).format('YYYY-MM-DD HH:mm:ss'),
      order_id: gatewayOrderId,
      amount: parseFloat(totalamount),
      customerData: {
        ...customerData.toJSON?.(),
        ...customerData.user?.toJSON?.(),
        user: undefined, // remove nested user
        customer_img: customerData.customer_img || "https://astro.synilogictech.com/assets/img/customer.png"
      }
    };

    return res.json({
      status: 1,
      msg: 'Recharge Request successfully.',
      payu_data: {
        status: 1,
        paymentLink: payu_data.paymentLink,
        msg: payu_data.msg || 'Payment link generated successfully',
        order_id: gatewayOrderId
      },
      data
    });
    } else {
      return res.status(500).json({
        status: 0,
        msg: payu_data.msg || 'Something went wrong!',
      });
    }
    } else {
      // Unsupported payment method
      console.error('❌ Unsupported Payment Method:', {
        received: payment_method,
        normalized: normalizedPaymentMethod,
        supportedMethods: ['razorpay', 'PhonePe', 'CCAvenue', 'Cashfree', 'Payu', 'PayTm']
      });
      
      return res.status(400).json({
        status: 0,
        msg: `Payment method "${payment_method}" is not supported. Supported methods: Razorpay, PhonePe, CCAvenue, Cashfree, PayU, PayTM`,
        error: {
          code: 'UNSUPPORTED_PAYMENT_METHOD',
          message: `Payment method "${payment_method}" is not supported`,
          received: payment_method,
          supported: ['razorpay', 'PhonePe', 'CCAvenue', 'Cashfree', 'Payu', 'PayTm']
        }
      });
    }


  } catch (err) {
    console.error("proceedPaymentRequest error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});




const RAZORPAY_WEBHOOK_SECRET = '123456';

router.post('/razorpayresponse', upload.none(), express.raw({ type: '*/*' }), async (req, res) => {
  console.log('🔔 Razorpay Webhook Received:', {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    bodyLength: req.body?.length || 0
  });

  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      console.log('❌ Missing Razorpay signature');
      return res.status(400).json({ status: 'missing_signature' });
    }

    const requestBody = req.body.toString();
    console.log('📦 Request Body:', requestBody.substring(0, 200) + '...');

    const computedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(requestBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );

    if (!isValid) {
      console.log('❌ Invalid signature');
      return res.status(400).json({ status: 'invalid_signature' });
    }

    console.log('✅ Signature verified successfully');

    const bodyJson = JSON.parse(requestBody);
    const payload = bodyJson?.payload || {};
    const paymentEntity = payload?.payment?.entity || {};
    const event = bodyJson?.event || '';

    console.log('📊 Webhook Event Details:', {
      event: event,
      paymentId: paymentEntity.id,
      orderId: paymentEntity.order_id,
      amount: paymentEntity.amount,
      currency: paymentEntity.currency,
      status: paymentEntity.status
    });

    const razorpay_response = {
      is_razorpay_webhook: 1,
      payment_method: 'razorpay',
      payment_id: paymentEntity.id || '',
      order_id: paymentEntity.order_id || '',
      order_status: ''
    };

    if (razorpay_response.order_id) {
      razorpay_response.order_status = event === 'payment.captured' ? 'Success' : 'Failed';
      
      console.log('💰 Payment Status:', {
        orderId: razorpay_response.order_id,
        paymentId: razorpay_response.payment_id,
        status: razorpay_response.order_status,
        event: event
      });

      // Process wallet payment update
      console.log('🔄 Processing wallet payment update...');
      const walletResult = await processPaymentUpdate(razorpay_response);
      console.log('💳 Wallet Update Result:', walletResult);
      
      // Process paid kundli order update and PDF generation
      console.log('📄 Processing paid kundli order update...');
      const kundliResult = await processPaidKundliPaymentUpdate(razorpay_response);
      console.log('📋 Kundli Update Result:', kundliResult);

      // Add stock management for product orders
      if (razorpay_response.order_status === 'Success') {
        console.log('�� Processing product stock update...');
        const stockResult = await updateProductStock(razorpay_response.order_id);
        console.log('📦 Stock Update Result:', stockResult);
      } else {
        console.log('❌ Payment failed, skipping stock update');
      }
    } else {
      console.log('⚠️ No order_id found in webhook payload');
    }

    console.log('✅ Webhook processing completed successfully');
    return res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('💥 Webhook Error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(200).json({ status: 'failed' });
  }
});

router.post('/paymentresponseccavenueapp', upload.none(), async (req, res) => {
  try {
    const CCAvenue = new CCAvenueGateway();
    const ccavenue_response = await CCAvenue.response(req);

    let payment_status = '';
    let err_msg = '';

    if (ccavenue_response?.tracking_id) {
      payment_status = ccavenue_response.order_status;
      ccavenue_response.payment_id = ccavenue_response.tracking_id;
      ccavenue_response.payment_method = 'CCAvenue';
    } else {
      ccavenue_response.payment_id = 'failed';
      ccavenue_response.payment_method = 'CCAvenue';
    }

    const result = await processPaymentUpdate(ccavenue_response);

    if (result?.msg) {
      err_msg = result.msg;
    }

    const status = payment_status === 'Success' ? 'Success' : 'Failure';

    return res.redirect(`/customerwalletapp/${status}?success=${encodeURIComponent(err_msg)}`);
  } catch (error) {
    console.error('CCAvenue response handling error:', error);
    return res.redirect(`/customerwalletapp/Failure?success=${encodeURIComponent('Something went wrong')}`);
  }
});

router.post('/paymentresponsephonepeapp', upload.none(), async (req, res) => {
  try {
    console.log('PhonePe Response Received:', req.body);
    
    const phonePe = new PhonePeGateway();
    const phonepe_response = await phonePe.response(req);

    let payment_status = '';
    let err_msg = '';

    if (phonepe_response.status === 1) {
      payment_status = 'Success';
      phonepe_response.payment_id = phonepe_response.transactionId || '';
      phonepe_response.payment_method = 'PhonePe';
    } else {
      payment_status = 'Failure';
      phonepe_response.payment_id = '';
      phonepe_response.payment_method = 'PhonePe';
    }

    // Update payment in your DB
    const result = await processPaymentUpdate(phonepe_response);

    if (result?.msg) {
      err_msg = result.msg;
    }

    const status = payment_status === 'Success' ? 'Success' : 'Failure';

    return res.redirect(`/customerwalletapp/${status}?success=${encodeURIComponent(err_msg)}`);
    
  } catch (error) {
    console.error('PhonePe response handling error:', error);
    return res.redirect(`/customerwalletapp/Failure?success=${encodeURIComponent('Something went wrong')}`);
  }
});

router.post('/paymentresponsephonepeappwebview', upload.none(), async (req, res) => {
  try {
    const phonePe = new PhonePeGateway();

    // Parse and verify the response from PhonePe
    const phonepe_response = await phonePe.response(req.body); // ensure this handles checksum validation internally

    let payment_status = '';
    let err_msg = '';

    if (phonepe_response?.transactionId) {
      payment_status = phonepe_response.state || phonepe_response.order_status || ''; // PhonePe uses "COMPLETED", "FAILED"
      phonepe_response.payment_id = phonepe_response.transactionId;
      phonepe_response.payment_method = 'PhonePe';
    } else {
      phonepe_response.payment_id = '';
      phonepe_response.payment_method = 'PhonePe';
      payment_status = 'FAILED';
    }

    // Update the wallet/payment status in your DB
    const result = await processPaymentUpdate(phonepe_response);

    if (result?.msg) {
      err_msg = result.msg;
    }

    const status = payment_status.toUpperCase() === 'COMPLETED' ? 'Success' : 'Failure';

    return res.redirect(`/customerwalletappwebview/${status}?success=${encodeURIComponent(err_msg)}`);
  } catch (error) {
    console.error('PhonePe WebView response handling error:', error);
    return res.redirect(`/customerwalletappwebview/Failure?success=${encodeURIComponent('Something went wrong')}`);
  }
});
router.post('/paymentresponse/payu', upload.none(), async (req, res) => {
  let result = {};
  let payment_status = '';
  let err_msg = '';

  try {
    const { status, mihpayid, udf1 } = req.body;

    if (status && udf1) {
      const payu_response = {
        order_id: udf1,
        payment_id: mihpayid || '',
        payment_method: 'Payu',
        order_status: status === 'success' ? 'Success' : 'Failed',
      };

      if (payu_response.order_status === 'Success') {
        payment_status = 'success';
      }

      // Process wallet payment update
      result = await Api.updateOnlinePayment(payu_response);
      
      // Process paid kundli order update and PDF generation
      await processPaidKundliPaymentUpdate(payu_response);
    }

    if (result?.msg) {
      err_msg = result.msg;
    }

    const redirectStatus = payment_status === 'success' ? 'Success' : 'Failure';

    return res.redirect(`/customerwalletapp/${redirectStatus}?msg=${encodeURIComponent(err_msg)}`);
  } catch (error) {
    console.error('PayU payment response error:', error);
    return res.redirect(`/customerwalletapp/Failure?msg=${encodeURIComponent('Something went wrong')}`);
  }
});

router.post('/paymentresponse/cashfree', upload.none(), async (req, res) => {
  let result = {};
  let err_msg = '';
  let status = 'Failure';

  try {
    const attributes = req.body;

    const cashfree_response = {
      payment_method: 'Cashfree',
    };

    const order_id = attributes?.data?.order?.order_id || '';
    const payment_id = attributes?.data?.payment?.cf_payment_id || '';
    const payment_status = attributes?.data?.payment?.payment_status || '';

    if (order_id) {
      cashfree_response.order_id = order_id;
      cashfree_response.payment_id = payment_id;
      cashfree_response.order_status = payment_status === 'SUCCESS' ? 'Success' : 'Failed';

      // Process wallet payment update
      result = await Api.updateOnlinePayment(cashfree_response);
      
      // Process paid kundli order update and PDF generation
      await processPaidKundliPaymentUpdate(cashfree_response);

      if (result?.msg) {
        err_msg = result.msg;
      }

      if (result?.status === 1) {
        status = 'Success';
      }
    }

    return res.json(result);
    // For redirection instead of JSON response:
    // return res.redirect(`/customerwalletapp/${status}?msg=${encodeURIComponent(err_msg)}`);
  } catch (error) {
    console.error('Cashfree payment response error:', error);
    return res.status(500).json({ status: 0, msg: 'Something went wrong' });
  }
});

export default router;
