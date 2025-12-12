////////////////////////////////////4th///////////////////////////////////////////////////////////////////
import { checkUserApiKey, getTotalBalanceById } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import User from '../_models/users.js';
import { Sanjeevini } from '../_models/Sanjeevini.js';
import Offer from '../_models/offers.js';
import RazorpayApi from '../_helpers/services/RazorpayApi.js';
import PhonePeGateway from '../_helpers/services/PhonePeGateway.js';
import PayUGateway from '../_helpers/services/PayUGateway.js';
import CCAvenueGateway from '../_helpers/services/CCAvenueGateway.js';
import CashfreeGateway from '../_helpers/services/CashfreeGateway.js';
import moment from 'moment';
import Customer from '../_models/customers.js';
import Wallet from '../_models/wallet.js';
import { SanjeeviniOrder } from '../_models/SanjeeviniOrder.js';
import { sanjeeviniCalculation } from './sanjeeviniCalculationController.js';

// Helper function to generate sequence code
const generateSequenceCode = (prefix) => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomNum}`;
};

// Helper function to generate N digit random number
const generateNDigitRandomNumber = (digits) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to create wallet history for other transactions
const walletHistoryCreateForOther = async (data) => {
  try {
    const {
      user_uni_id,
      gateway_order_id,
      order_id,
      useAmount,
      transaction_code,
      transaction_code_msg,
      wallet_status,
      offer_code
    } = data;

    await Wallet.create({
      user_uni_id,
      gateway_order_id,
      reference_id: order_id,
      gateway_payment_id: '',
      transaction_code,
      wallet_history_description: transaction_code_msg,
      transaction_amount: useAmount,
      amount: useAmount,
      main_type: 'dr',
      admin_percentage: 0,
      gst_amount: 0,
      astro_amount: 0,
      admin_amount: 0,
      tds_amount: 0,
      offer_amount: 0,
      gateway_charge: 0,
      coupan_amount: 0,
      status: wallet_status,
      payment_method: 'purchase_sanjeevini',
      offer_status: offer_code ? 1 : 0,
      currency_code: 'INR',
      currency_symbol: '₹',
      exchange_rate: 1.0
    });
  } catch (error) {
    console.error('Error creating wallet history:', error);
  }
};

// Helper function to process sanjeevini purchase logic
const processSanjeeviniPurchase = async (req) => {
  const {
    api_key,
    user_uni_id,
    sanjeevini_id,
    offer_code = '',
    reference_id = '',
    wallet_check = 0,
    payment_method,
    is_updated = 0
  } = req.body;

  if (!api_key || !user_uni_id || !sanjeevini_id) {
    return {
      status: 0,
      msg: 'api_key, user_uni_id, and sanjeevini_id are required',
    };
  }
  
  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    return { status: 0, error_code: 101, msg: 'Unauthorized User... Please login again' };
  }

  // Check if already purchased
  const existingOrder = await SanjeeviniOrder.findOne({
    where: { 
      sanjeevini_id, 
      user_uni_id 
    }
  });

  if (existingOrder && existingOrder.status === 1) {
    return {
      status: 0,
      order_id: "",
      msg: "This Sanjeevini is already purchased by you"
    };
  }

  // Get calculation result
  const calculationRequest = {
    body: {
      api_key,
      user_uni_id,
      sanjeevini_id,
      offer_code,
      reference_id,
      wallet_check
    }
  };

  const calculationResult = await sanjeeviniCalculation(calculationRequest, { json: (data) => data });
  
  if (calculationResult.status !== 1) {
    return {
      status: 0,
      order_id: "",
      msg: calculationResult.msg || "Failed please try again"
    };
  }

  const order_id = generateSequenceCode('SNJV');
  const date = new Date();
  let where_from = 'web';
  let product_order_payment_status = '1';
  let msg = "Payment Successfully";
  let payment_gateway_status = 0;
  let wallet_status = 1;
  let gateway_order_id = '';
  let payment_gateway_resp = '';

  // Check if payment is required
  if (calculationResult.data.payable_amount && calculationResult.data.payable_amount > 0) {
    product_order_payment_status = '0';
    let payment_method_final = '';

          // Check if payment gateway is configured
      if (getConfig('payment_gateway')) {
      const user = await User.findOne({
        where: { user_uni_id },
        include: [{ model: Customer, as: 'customer', required: false }],
        raw: true,
        nest: true,
      });

      if (payment_method) {
        where_from = 'app';
        
           if (payment_method === 'razorpay') {
            payment_method_final = 'razorpay';
            const razorpay_id = getConfig('razorpay_id');
            const logo = getConfig('logo');
            
            const razorpayApi = new RazorpayApi();
            const response = await razorpayApi.createOrderId({ 
              amount: calculationResult.data.payable_amount, 
              currency: 'INR' 
            });
            
            if (response.status === 1) {
              payment_gateway_resp = {
                phone: user.phone,
                amount: calculationResult.data.payable_amount,
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
                msg: response.msg || "Failed please try again"
              };
            }
          } else if (payment_method === 'CCAvenue') {
            payment_method_final = 'CCAvenue';
            gateway_order_id = generateNDigitRandomNumber(15);
            payment_gateway_resp = {
              merchant_id: getConfig('ccavenue_merchant_id'),
              currency: getConfig('ccavenue_currency'),
              redirect_url: getConfig('ccavenue_redirect_url'),
              cancel_url: getConfig('ccavenue_cancel_url'),
              language: getConfig('ccavenue_language'),
            order_id: gateway_order_id,
            amount: calculationResult.data.payable_amount,
            billing_name: user.name || '',
            billing_tel: '',
            billing_email: '',
            merchant_param1: user_uni_id,
          };
         } else if (payment_method === 'PhonePe') {
            payment_method_final = 'PhonePe';
            gateway_order_id = "ORD" + generateNDigitRandomNumber(12);
            payment_gateway_resp = {
              merchantTransactionId: gateway_order_id,
              merchantUserId: user_uni_id,
              amount: calculationResult.data.payable_amount,
              redirectUrl: getConfig('phonepe_redirect_url'),
              callbackUrl: getConfig('phonepe_callback_url'),
              redirectUrlWeb: getConfig('phonepe_redirect_url_web'),
              callbackUrlWeb: getConfig('phonepe_callback_url_web'),
              mobileNumber: user.phone,
              is_updated: is_updated
            };
         } else if (payment_method === 'Cashfree') {
            payment_method_final = 'Cashfree';
            const customerData = await Customer.findOne({
              where: { customer_uni_id: user_uni_id },
              include: [{ model: User, as: 'user' }],
              raw: true,
              nest: true,
            });
            
            let cust_phone = customerData?.phone || '';
            if (cust_phone) {
              cust_phone = cust_phone.slice(-10);
            }
            
            gateway_order_id = "order_" + generateNDigitRandomNumber(8);
            payment_gateway_resp = {
              gateway_order_id,
              amount: calculationResult.data.payable_amount,
              returnUrl: getConfig('cashfree_redirect_url'),
              notifyUrl: getConfig('cashfree_callback_url'),
              customer_id: user_uni_id,
              customer_phone: cust_phone,
              customer_name: customerData?.name || '',
              customer_email: customerData?.email || '',
            };
           } else if (payment_method === 'Payu') {
            payment_method_final = 'Payu';
            const customerData = await Customer.findOne({
              where: { customer_uni_id: user_uni_id },
              include: [{ model: User, as: 'user' }],
              raw: true,
              nest: true,
            });
            
            let cust_phone = customerData?.phone || '';
            if (cust_phone) {
              cust_phone = cust_phone.slice(-10);
            }
            
            gateway_order_id = "ORD" + generateNDigitRandomNumber(8);
            payment_gateway_resp = {
              gateway_order_id,
              amount: calculationResult.data.payable_amount,
              successURL: getConfig('payu_redirect_url'),
              failureURL: getConfig('payu_callback_url'),
              customer_id: user_uni_id,
              customer_phone: cust_phone,
              customer_name: customerData?.name || '',
              customer_email: customerData?.email || '',
              description: 'Jeevini Purchase',
              is_updated: is_updated
            };
        } else {
          return {
            status: 0,
            msg: "No Payment Gateway Available"
          };
        }
      } else {
          // Default payment gateway based on config
            if (getConfig('payment_gateway') === 'Razorpay') {
            payment_method_final = 'razorpay';
            const razorpay_id = getConfig('razorpay_id');
            const logo = getConfig('logo');
            
            const razorpayApi = new RazorpayApi();
            const response = await razorpayApi.createOrderId({ 
              amount: calculationResult.data.payable_amount, 
              currency: 'INR' 
            });
            
            if (response.status === 1) {
              payment_gateway_resp = {
                phone: user.phone,
                amount: calculationResult.data.payable_amount,
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
                msg: response.msg || "Failed please try again"
              };
            }
            } else if(getConfig('payment_gateway') === 'CCAvenue') {
            payment_method_final = 'CCAvenue';
            gateway_order_id = generateNDigitRandomNumber(15);
            payment_gateway_resp = {
              merchant_id: getConfig('ccavenue_merchant_id'),
              currency: getConfig('ccavenue_currency'),
              redirect_url: getConfig('product_purchase_response_url'),
              cancel_url: getConfig('product_purchase_response_url'),
              language: getConfig('ccavenue_language'),
            order_id: gateway_order_id,
            amount: calculationResult.data.payable_amount,
            billing_name: user.name || '',
            billing_tel: '',
            billing_email: '',
            merchant_param1: user_uni_id,
          };
            } else if (getConfig('payment_gateway') === 'PhonePe') {
            payment_method_final = 'PhonePe';
            gateway_order_id = "ORD" + generateNDigitRandomNumber(12);
            payment_gateway_resp = {
              merchantTransactionId: gateway_order_id,
              merchantUserId: user_uni_id,
              amount: calculationResult.data.payable_amount,
              redirectUrl: getConfig('product_purchase_response_url'),
              callbackUrl: getConfig('product_purchase_response_url'),
              mobileNumber: user.phone,
            };
            } else if (getConfig('payment_gateway') === 'Cashfree') {
          payment_method_final = 'Cashfree';
          const customerData = await Customer.findOne({
            where: { customer_uni_id: user_uni_id },
            include: [{ model: User, as: 'user' }],
            raw: true,
            nest: true,
          });
          
          let cust_phone = customerData?.phone || '';
          if (cust_phone) {
            cust_phone = cust_phone.slice(-10);
          }
          
          gateway_order_id = "order_" + generateNDigitRandomNumber(8);
          payment_gateway_resp = {
            gateway_order_id,
            amount: calculationResult.data.payable_amount,
            returnUrl: getConfig('cashfree_redirect_url'),
            notifyUrl: getConfig('cashfree_callback_url'),
            customer_id: user_uni_id,
            customer_phone: cust_phone,
            customer_name: customerData?.name || '',
            customer_email: customerData?.email || '',
          };
            } else {
              return {
                status: 0,
                msg: "No Payment Gateway Available"
              };
            }
      }

      // Create wallet entry for payment
      const recharge_amount = Math.round((calculationResult.data.payable_amount - calculationResult.data.recharge_gst_value) * 100) / 100;
      await Wallet.create({
        reference_id: order_id,
        gateway_order_id,
        gateway_payment_id: '', // Add missing field
        user_uni_id,
        transaction_code: 'add_wallet',
        wallet_history_description: `Wallet Add Amount by Customer Recharge on Sanjeevini Purchase # RS. ${recharge_amount}`,
        transaction_amount: calculationResult.data.payable_amount,
        amount: recharge_amount,
        main_type: 'cr',
        admin_percentage: 0,
        gst_amount: calculationResult.data.recharge_gst_value,
        astro_amount: 0,
        admin_amount: 0,
        tds_amount: 0,
        offer_amount: 0,
        gateway_charge: 0,
        coupan_amount: 0,
        status: wallet_status,
        offer_status: offer_code ? 1 : 0,
        payment_method: payment_method_final,
        where_from,
        currency_code: 'INR',
        currency_symbol: '₹',
        exchange_rate: 1.0
      });

      msg = "Payment Gateway Request";
      payment_gateway_status = 1;
      wallet_status = 0;
    } else {
      return {
        status: 0,
        msg: "No Payment Gateway Available"
      };
    }
  }
  
  const currentTime = moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss");

  // Create or update Sanjeevini order
  if (existingOrder) {
    await existingOrder.update({
      order_id,
      subtotal: calculationResult.data.subtotal,
      reference_id: calculationResult.data.reference_id,
      reference_percent: calculationResult.data.ref_percentage,
      reference_amount: calculationResult.data.reference_amount,
      offer_percent: calculationResult.data.ref_disc_percentage,
      offer_amount: calculationResult.data.offer_amount,
      total_amount: calculationResult.data.finalamount,
      status: product_order_payment_status,
      updated_at: currentTime
    });
  } else {
    await SanjeeviniOrder.create({
      sanjeevini_id,
      order_id,
      user_uni_id,
      subtotal: calculationResult.data.subtotal,
      reference_id: calculationResult.data.reference_id,
      reference_percent: calculationResult.data.ref_percentage,
      reference_amount: calculationResult.data.reference_amount,
      offer_percent: calculationResult.data.ref_disc_percentage,
      offer_amount: calculationResult.data.offer_amount,
      total_amount: calculationResult.data.finalamount,
      status: product_order_payment_status,
      created_at: currentTime,
      updated_at: currentTime
    });
  }

  // Create wallet history for other transactions
  await walletHistoryCreateForOther({
    user_uni_id,
    gateway_order_id,
    order_id,
    useAmount: calculationResult.data.finalamount,
    transaction_code: 'purchase_sanjeevini',
    transaction_code_msg: 'Purchase Sanjeevini',
    wallet_status,
    offer_code
  });

  // Handle reference commission
  if (reference_id && calculationResult.data.reference_amount > 0) {
    await Wallet.create({
      user_uni_id: reference_id,
      reference_id: order_id,
      gateway_order_id,
      gateway_payment_id: '', // Add missing field
      transaction_code: 'add_wallet_by_purchase_sanjeevini_reference',
      wallet_history_description: `Add Amount by Reference on Sanjeevini Purchase # RS. ${calculationResult.data.finalamount}`,
      transaction_amount: calculationResult.data.reference_amount,
      amount: calculationResult.data.reference_amount,
      admin_percentage: 0,
      gst_amount: 0,
      astro_amount: 0,
      admin_amount: 0,
      tds_amount: calculationResult.data.reference_tds_amount,
      offer_amount: 0,
      gateway_charge: 0,
      coupan_amount: 0,
      main_type: 'cr',
      status: wallet_status,
      currency_code: 'INR',
      currency_symbol: '₹',
      exchange_rate: 1.0
    });
  }

  // Get customer data
  const customerData = await Customer.findOne({
    where: { customer_uni_id: user_uni_id },
    include: [{ model: User, as: 'user' }],
    raw: true,
    nest: true,
  });

  const imageBase = process.env.IMAGE_BASE_URL_CUSTOMER || 'https://astro.synilogictech.com/';
  const defaultImg = process.env.DEFAULT_CUSTOMER_IMAGE || 'assets/img/customer.png';

  const formattedCustomerData = {
    ...customerData,
    customer_uni_id: user_uni_id,
    customer_img: customerData?.customer_img
      ? `${imageBase}${customerData.customer_img}`
      : `${imageBase}${defaultImg}`,
  };

  // Prepare response
  const responseData = {
    status: 1,
    order_id,
    payment_gateway_status,
    msg,
    data: calculationResult.data,
    customerData: formattedCustomerData
  };

  if (payment_gateway_status === 1) {
    responseData.payment_gateway = payment_gateway_resp;
  }

  return responseData;
};

export const sanjeeviniPurchase = async (req, res) => {
  try {
    const result = await processSanjeeviniPurchase(req);
    
    if (res && typeof res.json === 'function') {
      return res.json(result);
    }
    
    return result;
  } catch (error) {
    console.error('Error in sanjeeviniPurchase:', error);
    if (res && typeof res.json === 'function') {
      return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
    }
    return { status: 0, msg: 'Internal Server Error' };
  }
};

// Enhanced controller with payment gateway processing
export const sanjeeviniPurchaseWithGateway = async (req, res) => {
  try {
    const {
      api_key,
      user_uni_id,
      sanjeevini_id,
      offer_code = '',
      reference_id = '',
      wallet_check = 0,
      payment_method,
      is_updated = 0
    } = req.body;

    if (!api_key || !user_uni_id || !sanjeevini_id || !payment_method) {
      return res.status(400).json({
        status: 0,
        msg: 'api_key, user_uni_id, sanjeevini_id, and payment_method are required',
      });
    }
    
    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      return res.json({ status: 0, error_code: 101, msg: 'Unauthorized User... Please login again' });
    }

    // Get customer data
    const customerData = await Customer.findOne({
      where: { customer_uni_id: user_uni_id },
      include: [{ model: User, as: 'user' }],
      raw: true,
      nest: true,
    });

    // Call the helper function directly
    const result = await processSanjeeviniPurchase(req);
    
    if (result && result.status === 1 && result.payment_gateway_status === 1) {
      // Process payment gateway specific logic
      if (payment_method === 'CCAvenue') {
        try {
          const ccavenueGateway = new CCAvenueGateway();
          await ccavenueGateway.init();
          const ccavenue_request = await ccavenueGateway.request(result.payment_gateway);
          
          if (ccavenue_request && ccavenue_request.encRequest) {
            result.ccavenue_data = {
              order_id: result.order_id,
              access_code: getConfig('ccavenue_access_code'),
              redirect_url: getConfig('ccavenue_redirect_url'),
              cancel_url: getConfig('ccavenue_cancel_url'),
              enc_val: ccavenue_request.encRequest,
              merchant_id: getConfig('ccavenue_merchant_id'),
              working_key: getConfig('ccavenue_working_key'),
              currency: getConfig('ccavenue_currency'),
              language: getConfig('ccavenue_language'),
            };
          } else {
            result.status = 0;
            result.msg = 'Something went Wrong on payment gateway. Please Try Again';
          }
        } catch (gatewayError) {
          console.error('CCAvenue Gateway Error:', gatewayError);
          result.status = 0;
          result.msg = 'Payment gateway error. Please Try Again';
        }
      } else if (payment_method === 'PhonePe') {
        try {
          const phonepeGateway = new PhonePeGateway();
          const phonepe_data = await phonepeGateway.requestApp(result.payment_gateway);
          
          if (phonepe_data && phonepe_data.status === 1) {
            phonepe_data.order_id = result.order_id;
            result.phonepe_data = phonepe_data;
          } else {
            result.status = 0;
            result.msg = 'Something went Wrong on payment gateway. Please Try Again';
          }
        } catch (gatewayError) {
          console.error('PhonePe Gateway Error:', gatewayError);
          result.status = 0;
          result.msg = 'Payment gateway error. Please Try Again';
        }
      } else if (payment_method === 'Cashfree') {
        try {
          const cashfreeGateway = new CashfreeGateway();
          const cashfree_data = await cashfreeGateway.request(result.payment_gateway);
          
          if (cashfree_data && cashfree_data.status === 1) {
            result.cashfree_data = cashfree_data;
          } else {
            result.status = 0;
            result.msg = 'Something went Wrong on payment gateway. Please Try Again';
          }
        } catch (gatewayError) {
          console.error('Cashfree Gateway Error:', gatewayError);
          result.status = 0;
          result.msg = 'Payment gateway error. Please Try Again';
        }
      } else if (payment_method === 'Payu') {
        try {
          const payuGateway = new PayUGateway();
          const payu_data = await payuGateway.generatePaymentLink(result.payment_gateway);
          
          if (payu_data && payu_data.status === 1) {
            result.payu_data = payu_data;
          } else {
            result.status = 0;
            result.msg = 'Something went Wrong on payment gateway. Please Try Again';
          }
        } catch (gatewayError) {
          console.error('PayU Gateway Error:', gatewayError);
          result.status = 0;
          result.msg = 'Payment gateway error. Please Try Again';
        }
      }
    }

    // Add customer data to result
    if (result) {
      result.customerData = customerData;
    }

    // Send the final response
    return res.json(result || { status: 0, msg: 'Something went wrong' });

  } catch (error) {
    console.error('Error in sanjeeviniPurchaseWithGateway:', error);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
  }
};
