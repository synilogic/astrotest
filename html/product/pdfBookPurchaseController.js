// Controller: pdfBookPurchaseController.js

import { checkUserApiKey, getTotalBalanceById } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';
import User from '../_models/users.js';
import Offer from '../_models/offers.js';
import Wallet from '../_models/wallet.js';
import Customer from '../_models/customers.js';
import { PdfBook } from '../_models/pdfBookModel.js';
import { PdfBookOrder } from '../_models/pdfBookOrderModel.js';
import RazorpayApi from '../_helpers/services/RazorpayApi.js';
import PhonePeGateway from '../_helpers/services/PhonePeGateway.js';
import PayUGateway from '../_helpers/services/PayUGateway.js';
import CCAvenueGateway from '../_helpers/services/CCAvenueGateway.js';
import CashfreeGateway from '../_helpers/services/CashfreeGateway.js';
import moment from 'moment';

export const pdfBookPurchase = async (req, res) => {
  try {
    const {
      api_key,
      user_uni_id,
      pdf_book_id,
      offer_code = '',
      wallet_check = 0,
      payment_method,
    } = req.body;

    if (!api_key || !user_uni_id || !pdf_book_id) {
      return res.status(400).json({ status: 0, msg: 'api_key, user_uni_id and pdf_book_id are required' });
    }

    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) return res.json({ status: 0, error_code: 101, msg: 'Unauthorized User... Please login again' });

    const user = await User.findOne({
      where: { user_uni_id },
      include: [{ model: Customer, as: 'customer', required: false }],
      raw: true,
      nest: true,
    });

    if (!user) return res.json({ status: 0, msg: 'Invalid User' });

    const book = await PdfBook.findOne({ where: { id: pdf_book_id, status: 1 } });
    if (!book || book.price <= 0) return res.json({ status: 0, msg: 'Invalid PDF Book' });

    const subtotal = book.price;
    const user_wallet_balance = await getTotalBalanceById(user_uni_id) || 0;

    let offer_amount = 0;
    const ref_disc_percentage = parseFloat(constants.astrologer_ref_discount_percentage || 0);
    let finalamount = subtotal;
    let wallet_amount = 0;
    let payable_amount = 0;

    // Offer logic
    let offer = null;
    if (offer_code) {
      offer = await Offer.findOne({ where: { offer_code, status: 1 } });
      const now = moment();
      if (offer && now.isBetween(offer.offer_validity_from, offer.offer_validity_to)) {
        if (subtotal > offer.minimum_order_amount && subtotal <= offer.max_order_amount) {
          offer_amount = offer.offer_category === 'amount'
            ? offer.discount_amount
            : (subtotal * offer.discount_amount) / 100;
        } else {
          return res.json({ status: 0, msg: 'Order amount not in valid range for offer' });
        }
      } else {
        return res.json({ status: 0, msg: 'Invalid or expired offer code' });
      }
    } else if (ref_disc_percentage > 0) {
      offer_amount = (subtotal * ref_disc_percentage) / 100;
    }

    finalamount = parseFloat((subtotal - offer_amount).toFixed(2));

    if (wallet_check == 1) {
      if (user_wallet_balance >= finalamount) {
        wallet_amount = finalamount;
        payable_amount = 0;
      } else if (user_wallet_balance > 0) {
        wallet_amount = user_wallet_balance;
        payable_amount = finalamount - wallet_amount;
      } else {
        payable_amount = finalamount;
      }
    } else {
      payable_amount = finalamount;
    }

    const gst_percent = parseFloat(constants.gst || 18);
    let gst_value = 0;
    if (payable_amount > 0) {
      gst_value = parseFloat(((payable_amount * gst_percent) / 100).toFixed(2));
    }
    payable_amount = parseFloat((payable_amount + gst_value).toFixed(2));

    const order_id = `PDFB${Date.now()}`;

    // Wallet deduction
    if (wallet_check == 1 && wallet_amount > 0) {
      await Wallet.create({
        user_uni_id,
        gateway_order_id: order_id,
        reference_id: order_id,
        gateway_payment_id: '',
        transaction_code: 'remove_wallet_by_purchase_pdf_book',
        wallet_history_description: `Wallet deduction for PDF Book #Rs. ${wallet_amount}`,
        transaction_amount: wallet_amount,
        amount: wallet_amount,
        main_type: 'dr',
        status: payable_amount === 0 ? 1 : 0,
        gst_amount: 0,
        payment_method: wallet_amount === finalamount ? 'wallet' : payment_method,
      });
    }

    // If fully paid by wallet
    if (payable_amount === 0) {
      await PdfBookOrder.create({
        order_id,
        pdf_book_id,
        user_uni_id,
        subtotal,
        offer_percent: offer?.discount_amount || 0,
        offer_amount,
        total_amount: 0,
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const imageBase = process.env.IMAGE_BASE_URL_CUSTOMER || 'https://astro.synilogictech.com/';
      const defaultImg = process.env.DEFAULT_CUSTOMER_IMAGE || 'assets/img/customer.png';
      const customerData = {
        ...user.customer,
        ...user,
        customer_uni_id: user.user_uni_id,
        customer_img: user.customer?.customer_img
          ? `${imageBase}${user.customer.customer_img}`
          : `${imageBase}${defaultImg}`,
      };

      return res.json({
        status: 1,
        order_id,
        payment_gateway_status: 0,
        payment_gateway: {},
        msg: 'Order placed using wallet only',
        data: {
          pdf_book_amount: subtotal,
          offer_amount,
          wallet_amount,
          subtotal,
          finalamount,
          recharge_gst_percent: gst_percent,
          recharge_gst_value: gst_value,
          payable_amount,
          my_wallet_amount: user_wallet_balance,
        },
        customerData,
      });
    }

    // Payment Gateway Handling
    if (!payment_method) {
      return res.status(400).json({ status: 0, msg: 'payment_method is required when wallet is insufficient' });
    }

    let gatewayData = {};
    const gateway_order_id = order_id;

    if (payment_method === 'razorpay') {
      const gateway = new RazorpayApi();
      const gatewayResp = await gateway.createOrderId({ amount: payable_amount });
      if (gatewayResp.status !== 1) return res.status(500).json({ status: 0, msg: 'Razorpay error' });
      gatewayData = {
        razorpay_id: gateway.razorpayId,
        order_id: gatewayResp.orderId,
        amount: payable_amount,
        currency: 'INR',
        email: user.email,
        phone: user.phone,
        name: user.name,
        logo: user.customer?.customer_img || 'default.png',
        user_uni_id,
      };
    } else if (payment_method === 'PhonePe') {
      const phonepe = new PhonePeGateway();
      const resp = await phonepe.requestApp({
        merchantTransactionId: gateway_order_id,
        merchantUserId: user_uni_id,
        amount: payable_amount,
        redirectUrl: constants.phonepe_redirect_url,
        callbackUrl: constants.phonepe_callback_url,
        mobileNumber: user.phone,
      });
      if (resp.status !== 1) return res.status(500).json({ status: 0, msg: 'PhonePe error' });
      gatewayData = { phonepe_data: resp };
    } else if (payment_method === 'Payu') {
      const payu = new PayUGateway();
      const payuResp = await payu.generatePaymentLink({
        gateway_order_id,
        amount: payable_amount,
        successURL: constants.payu_redirect_url,
        failureURL: constants.payu_callback_url,
        currency: 'INR',
        customer_name: user.name,
        customer_phone: user.phone,
        customer_email: user.email,
      });
      if (payuResp.status !== 1) return res.status(500).json({ status: 0, msg: 'PayU error' });
      gatewayData = { payu_data: payuResp };
    } else if (payment_method === 'CCAvenue') {
      const ccavenue = new CCAvenueGateway();
      await ccavenue.init();
      const req = await ccavenue.request({
        order_id,
        amount: payable_amount,
        redirect_url: constants.ccavenue_redirect_url,
        cancel_url: constants.ccavenue_cancel_url,
        billing_name: user.name,
        billing_tel: user.phone,
        billing_email: user.email,
      });
      gatewayData = {
        ccavenue_url: ccavenue.getEndPoint(),
        encRequest: req.encRequest,
        accessCode: ccavenue.accessCode,
      };
    } else if (payment_method === 'Cashfree') {
      const cashfree = new CashfreeGateway();
      const cfResp = await cashfree.request({
        gateway_order_id,
        amount: payable_amount,
        returnUrl: constants.cashfree_redirect_url,
        notifyUrl: constants.cashfree_callback_url,
        customer_id: user_uni_id,
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone,
      });
      if (cfResp.status !== 1) return res.status(500).json({ status: 0, msg: cfResp.msg || 'Cashfree error' });
      gatewayData = { cashfree_data: cfResp };
    }

    await PdfBookOrder.create({
      order_id,
      pdf_book_id,
      user_uni_id,
      subtotal,
      offer_percent: offer?.discount_amount || 0,
      offer_amount,
      total_amount: payable_amount,
      status: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const imageBase = process.env.IMAGE_BASE_URL_CUSTOMER || 'https://astro.synilogictech.com/';
    const defaultImg = process.env.DEFAULT_CUSTOMER_IMAGE || 'assets/img/customer.png';
    const customerData = {
      ...user.customer,
      ...user,
      customer_uni_id: user.user_uni_id,
      customer_img: user.customer?.customer_img
        ? `${imageBase}${user.customer.customer_img}`
        : `${imageBase}${defaultImg}`,
    };

    return res.json({
      status: 1,
      order_id,
      payment_gateway_status: 1,
      payment_gateway: gatewayData,
      msg: 'Payment Gateway Request',
      data: {
        pdf_book_amount: subtotal,
        offer_amount,
        wallet_amount,
        subtotal,
        finalamount,
        recharge_gst_percent: gst_percent,
        recharge_gst_value: gst_value,
        payable_amount,
        my_wallet_amount: user_wallet_balance,
      },
      customerData,
    });
  } catch (error) {
    console.error('Error in pdfBookPurchase:', error);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
  }
};
