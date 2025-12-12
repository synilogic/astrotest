// servicePurchaseController.js

import  ServiceOrder  from '../_models/serviceOrder.js';
import { ServiceAssign } from '../_models/serviceAssign.js';
import Wallet from '../_models/wallet.js';
import User from '../_models/users.js';
import Customer from '../_models/customers.js';
import { serviceCalculationLogic } from './serviceCalculationLogic.js';
import { generateOrderId, generateNDigitRandomNumber } from '../_helpers/generator.js';
import { getCurrency, checkUserApiKey, sendNotification } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import RazorpayApi from '../_helpers/services/RazorpayApi.js';
import PhonePeGateway from '../_helpers/services/PhonePeGateway.js';
import PayUGateway from '../_helpers/services/PayUGateway.js';
import CCAvenueGateway from '../_helpers/services/CCAvenueGateway.js';
import CashfreeGateway from '../_helpers/services/CashfreeGateway.js';

export const servicePurchase = async (req, res) => {
  try {
    const {
      api_key, user_uni_id, customer_uni_id, astrologer_uni_id,
      service_assign_id, offer_code = '', date, time, payment_method
    } = req.body;

    if (!api_key || !user_uni_id || !customer_uni_id || !astrologer_uni_id || !service_assign_id) {
      return res.status(400).json({ status: 0, msg: 'Missing required fields' });
    }

    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      return res.json({ status: 0, error_code: 101, msg: 'Unauthorized User... Please login again' });
    }

    const default_currency_code = 'INR';
    const cust_currency_detail = await getCurrency(customer_uni_id, 'all');
    if (cust_currency_detail?.currency_code !== default_currency_code) {
      return res.json({ status: 0, msg: 'This feature is not available for your country' });
    }

    const astro_currency_detail = await getCurrency(astrologer_uni_id, 'all');
    if (astro_currency_detail?.currency_code !== default_currency_code) {
      return res.json({ status: 0, msg: 'This feature is not available for this astrologer' });
    }

    const selected_gateway = payment_method || await getConfig('payment_gateway');

    const existingOrder = await ServiceOrder.findOne({
      where: {
        service_assign_id,
        customer_uni_id,
        astrologer_uni_id,
        status: ['pending', 'approved'],
        payment_status: 'paid',
      }
    });

    if (existingOrder) {
      return res.json({ status: 0, msg: 'Order Already Exists' });
    }

    const result = await serviceCalculationLogic(req.body);
    if (result.status !== 1) {
      return res.json({ status: 0, msg: result.msg || 'Something went wrong in calculation' });
    }

    const assign = await ServiceAssign.findByPk(service_assign_id);
    const order_id = generateOrderId('SERV');
    let payment_status = result.data.payable_amount > 0 ? 'unpaid' : 'paid';

    const createdOrder = await ServiceOrder.create({
      service_assign_id,
      customer_uni_id,
      astrologer_uni_id,
      order_id,
      available_duration: assign?.duration || '0',
      price: assign?.price || '0',
      status: 'pending',
      payment_status,
      date,
      time,
    });

    const user = await User.findOne({ where: { user_uni_id } });
    const customer = await Customer.findOne({
      where: { customer_uni_id },
      include: [{ model: User, as: 'user' }]
    });

    const imageBase = process.env.IMAGE_BASE_URL_CUSTOMER || 'https://astro.synilogictech.com/';
    const defaultImg = process.env.DEFAULT_CUSTOMER_IMAGE || 'assets/img/customer.png';

    const customerData = {
      ...customer?.dataValues,
      customer_uni_id,
      customer_img: customer?.customer_img
        ? `${imageBase}${customer.customer_img}`
        : `${imageBase}${defaultImg}`,
    };

    if (result.data.wallet_amount > 0) {
      await Wallet.create({
        user_uni_id: customer_uni_id,
        gateway_order_id: order_id,
        reference_id: order_id,
        gateway_payment_id: '',
        transaction_code: 'remove_wallet_by_purchase_service',
        wallet_history_description: `Wallet deduction for Service Purchase #Rs. ${result.data.wallet_amount}`,
        transaction_amount: result.data.wallet_amount,
        amount: result.data.wallet_amount,
        main_type: 'dr',
        status: result.data.payable_amount === 0 ? 1 : 0,
        gst_amount: 0,
        payment_method: result.data.wallet_amount === result.data.finalamount ? 'wallet' : selected_gateway,
      });
    }

    await Wallet.create({
      user_uni_id: astrologer_uni_id,
      gateway_order_id: order_id,
      reference_id: order_id,
      gateway_payment_id: '',
      transaction_code: 'add_wallet_by_purchase_service',
      wallet_history_description: `Add Amount by Purchase service # Rs. ${result.data.finalamount}`,
      transaction_amount: result.data.astrologer_amount,
      amount: result.data.astrologer_amount,
      tds_amount: result.data.astrologer_tds_amount,
      main_type: 'cr',
      status: result.data.payable_amount === 0 ? 1 : 0,
      admin_amount: result.data.admin_amount,
      payment_method: selected_gateway,
    });

    // ✅ Fix: update order payment_status if wallet-only
    if (result.data.payable_amount === 0) {
      await ServiceOrder.update(
        { payment_status: 'paid' },
        { where: { id: createdOrder.id } }
      );

      sendNotification({
        title: 'New Booking',
        description: `You have a new booking request for ${assign?.service_name || 'Service'}.`,
        type: 'android',
        chunk: [user?.user_fcm_token]
      });

      return res.json({
        status: 1,
        order_id,
        payment_gateway_status: 0,
        payment_gateway: {},
        msg: 'Order placed using wallet only',
        data: {
          service_amount: assign?.price || 0,
          offer_amount: result.data.offer_amount,
          wallet_amount: result.data.wallet_amount,
          subtotal: result.data.subtotal,
          finalamount: result.data.finalamount,
          recharge_gst_percent: result.data.recharge_gst_percent,
          recharge_gst_value: result.data.recharge_gst_value,
          payable_amount: 0,
          my_wallet_amount: result.data.wallet_balance,
        },
        customerData,
      });
    }

    // If payable_amount > 0, initiate payment
    let gateway_order_id = order_id;
    let gatewayData = {};

    if (selected_gateway === 'Payu') {
      gateway_order_id = `ORD${generateNDigitRandomNumber(10)}`;
    }

    switch (selected_gateway) {
      case 'razorpay': {
        const gateway = new RazorpayApi();
        const gatewayResp = await gateway.createOrderId({ amount: result.data.payable_amount });
        if (gatewayResp.status !== 1) return res.status(500).json({ status: 0, msg: 'Razorpay error' });
        gatewayData = {
          razorpay_id: gateway.razorpayId,
          order_id: gatewayResp.orderId,
          amount: result.data.payable_amount,
          currency: 'INR',
          email: user.email,
          phone: user.phone,
          name: user.name,
          logo: customer?.customer_img || '62604.png',
          user_uni_id,
        };
        break;
      }

      case 'PhonePe': {
        const phonepe = new PhonePeGateway();
        const resp = await phonepe.requestApp({
          merchantTransactionId: gateway_order_id,
          merchantUserId: customer_uni_id,
          amount: result.data.payable_amount,
          redirectUrl: await getConfig('phonepe_redirect_url'),
          callbackUrl: await getConfig('phonepe_callback_url'),
          mobileNumber: user.phone,
        });
        if (resp.status !== 1) return res.status(500).json({ status: 0, msg: 'PhonePe error' });
        gatewayData = { phonepe_data: resp };
        break;
      }

      case 'Payu': {
        const payu = new PayUGateway();
        const payuResp = await payu.generatePaymentLink({
          gateway_order_id,
          amount: result.data.payable_amount,
          successURL: await getConfig('payu_redirect_url'),
          failureURL: await getConfig('payu_callback_url'),
          currency: 'INR',
          customer_name: user.name,
          customer_phone: user.phone,
          customer_email: user.email,
        });
        if (payuResp.status !== 1) return res.status(500).json({ status: 0, msg: 'PayU error' });
        gatewayData = { payu_data: payuResp };
        break;
      }

      case 'CCAvenue': {
        const ccavenue = new CCAvenueGateway();
        await ccavenue.init();
        const req = await ccavenue.request({
          order_id,
          amount: result.data.payable_amount,
          redirect_url: await getConfig('ccavenue_redirect_url'),
          cancel_url: await getConfig('ccavenue_cancel_url'),
          billing_name: user.name,
          billing_tel: user.phone,
          billing_email: user.email,
        });
        gatewayData = {
          ccavenue_url: ccavenue.getEndPoint(),
          encRequest: req.encRequest,
          accessCode: ccavenue.accessCode,
        };
        break;
      }

      case 'Cashfree': {
        const cashfree = new CashfreeGateway();
        const cfResp = await cashfree.request({
          gateway_order_id,
          amount: result.data.payable_amount,
          returnUrl: await getConfig('cashfree_redirect_url'),
          notifyUrl: await getConfig('cashfree_callback_url'),
          customer_id: user_uni_id,
          customer_name: user.name,
          customer_email: user.email,
          customer_phone: user.phone,
        });
        if (cfResp.status !== 1) return res.status(500).json({ status: 0, msg: cfResp.msg || 'Cashfree error' });
        gatewayData = { cashfree_data: cfResp };
        break;
      }

      default:
        return res.status(400).json({ status: 0, msg: 'Unsupported payment gateway' });
    }

    return res.json({
      status: 1,
      order_id,
      payment_gateway_status: 1,
      payment_gateway: gatewayData,
      msg: 'Payment Gateway Request',
      data: {
        service_amount: assign?.price || 0,
        offer_amount: result.data.offer_amount,
        wallet_amount: result.data.wallet_amount,
        subtotal: result.data.subtotal,
        finalamount: result.data.finalamount,
        recharge_gst_percent: result.data.recharge_gst_percent,
        recharge_gst_value: result.data.recharge_gst_value,
        payable_amount: result.data.payable_amount,
        my_wallet_amount: result.data.wallet_balance,
      },
      customerData,
    });
  } catch (error) {
    console.error('Error in servicePurchase:', error);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error', error: error.message });
  }
};
