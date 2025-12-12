
// controllers/paidKundliManualController.js
import { paidKundliManualListLogic} from './paidKundliManualLogic.js';
import { checkUserApiKey, getTotalBalanceById } from '../_helpers/common.js';
// import { getCustomerDetailsById } from '../_helpers/customers.js';
import { constants } from '../_config/constants.js';
import User from '../_models/users.js';
import Offer from '../_models/offers.js';
import Wallet from '../_models/wallet.js';
import Customer from '../_models/customers.js';
import { PaidKundliManual } from '../_models/paidKundliManualModel.js';
import { PaidKundliManualOrder } from '../_models/paidKundliManualOrderModel.js';
import RazorpayApi from '../_helpers/services/RazorpayApi.js';
//import PhonePeGateway from '../_helpers/services/PhonePeGateway.js';
//import PayUGateway from '../_helpers/services/PayUGateway.js';
//import CCAvenueGateway from '../_helpers/services/CCAvenueGateway.js';
//import CashfreeGateway from '../_helpers/services/CashfreeGateway.js';
import moment from 'moment';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';

export const paidKundliManualListController = async (req, res) => {
  try {
    const { api_key = '', user_uni_id = '' } = req.body;

    if (api_key || user_uni_id) {
      const isValid = await checkUserApiKey(api_key, user_uni_id);
      if (!isValid) {
        return res.json({
          status: 0,
          error_code: 101,
          msg: 'Unauthorized User... Please login again',
        });
      }
    }

    const result = await paidKundliManualListLogic(req.body);
    return res.json(result);
  } catch (err) {
    console.error('paidKundliManualListController Error:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Internal Server Error',
    });
  }
};

export const paidKundliManualCalculation = async (req, res) => {
  const {
    api_key,
    user_uni_id,
    paid_kundli_manual_id,
    report_type,
    order_for,
    offer_code,
    wallet_check,
    reference_id,
  } = req.body;

  if (!api_key || !user_uni_id || !paid_kundli_manual_id) {
    return res.json({
      status: 0,
      errors: {
        api_key: !api_key ? ['API key is required'] : [],
        user_uni_id: !user_uni_id ? ['User unique ID is required'] : [],
        paid_kundli_manual_id: !paid_kundli_manual_id ? ['Paid Kundli Manual ID is required'] : [],
      },
      message: 'Something went wrong',
      msg: 'Missing required fields',
    });
  }

  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
   const whereClause = {
  id: paid_kundli_manual_id,
  status: 1,
  price: { [Op.gt]: 0 },
};

if (report_type) {
  whereClause.report_type = report_type;
}

const manual = await PaidKundliManual.findOne({
  where: whereClause,
});


    if (!manual) {
      return res.json({ status: 0, msg: 'Order is invalid' });
    }

    const subtotal = manual.price;
    let wallet_amount = 0;
    let payable_amount = 0;
    let reference_amount = 0;
    let reference_tds_amount = 0;
    let reference_disc_amount = 0;
    let offer_amount = 0;
    let msg = '';
    const curDate = moment();
    const userBalance = await getTotalBalanceById(user_uni_id);
    let ref_percentage = parseFloat(process.env.ASTRO_REF_PERCENTAGE || 0);
    let ref_disc_percentage = parseFloat(process.env.ASTRO_REF_DISCOUNT_PERCENTAGE || 0);

    // Reference logic
    if (reference_id) {
      const astrologer = await User.findOne({ where: { user_uni_id: reference_id, status: 1, role_id: 3 } });

      if (astrologer) {
        if (ref_percentage > 0) reference_amount = (subtotal * ref_percentage) / 100;
        if (ref_disc_percentage > 0) reference_disc_amount = (subtotal * ref_disc_percentage) / 100;
      } else {
        msg = 'Invalid Reference Id';
        reference_amount = 0;
        ref_percentage = 0;
        ref_disc_percentage = 0;
      }
    }

    // Offer logic
    if (offer_code) {
      const offer = await Offer.findOne({ where: { offer_code, status: 1 } });
      if (offer) {
        const validFrom = moment(offer.offer_validity_from);
        const validTo = moment(offer.offer_validity_to);
        if (curDate.isBetween(validFrom, validTo)) {
          if (subtotal > offer.minimum_order_amount) {
            if (offer.max_order_amount >= subtotal) {
              if (offer.offer_category === 'amount') {
                offer_amount = offer.discount_amount;
              } else if (offer.offer_category === 'percentage') {
                offer_amount = (subtotal * offer.discount_amount) / 100;
              }
            } else {
              return res.json({ status: 0, msg: `Maximum Order value ${offer.max_order_amount}` });
            }
          } else {
            return res.json({ status: 0, msg: `Minimum Order value ${offer.minimum_order_amount}` });
          }
        } else {
          msg = 'Coupon code expiry';
        }
      } else {
        msg = 'Invalid Coupon code';
      }
    }

    if (offer_amount <= 0 && reference_disc_amount > 0) {
      offer_amount = reference_disc_amount;
    }

    let finalamount = subtotal - offer_amount;

    // Wallet logic
    const userAmount = parseFloat(userBalance || 0);
    if (wallet_check == 1) {
      if (userAmount >= finalamount) {
        wallet_amount = finalamount;
        payable_amount = 0;
      } else if (userAmount > 0) {
        wallet_amount = userAmount;
        payable_amount = finalamount - userAmount;
      } else {
        payable_amount = finalamount;
      }
    } else {
      payable_amount = finalamount;
    }

    const gst_percent = parseFloat(process.env.GST_PERCENT || 0);
    let gst_value = 0;
    if (payable_amount > 0 && gst_percent > 0) {
      gst_value = parseFloat(((payable_amount * gst_percent) / 100).toFixed(2));
    }
    payable_amount += gst_value;

    // TDS logic
    if (process.env.TDS_ON_REFERENCE == '1') {
      const tds = parseFloat(process.env.TDS_PERCENT || 0);
      if (tds > 0) {
        reference_tds_amount = parseFloat(((tds * reference_amount) / 100).toFixed(2));
        reference_amount -= reference_tds_amount;
      }
    }

    return res.json({
      status: 1,
      msg: msg || 'Success',
      data: {
        paid_kundli_manual_id: manual.id,
        order_amount: manual.price,
        report_type: manual.report_type,
        reference_id: reference_id || '',
        ref_percentage: +ref_percentage.toFixed(2),
        reference_amount: +reference_amount.toFixed(2),
        reference_tds_amount: +reference_tds_amount.toFixed(2),
        ref_disc_percentage: +ref_disc_percentage.toFixed(2),
        offer_amount: +offer_amount.toFixed(2),
        subtotal: +subtotal.toFixed(2),
        finalamount: +finalamount.toFixed(2),
        wallet_amount: +wallet_amount.toFixed(2),
        recharge_gst_percent: +gst_percent.toFixed(2),
        recharge_gst_value: +gst_value.toFixed(2),
        payable_amount: +payable_amount.toFixed(2),
        my_wallet_amount: +userAmount.toFixed(2),
      },
    });

  } catch (error) {
    console.error('paidKundliManualCalculation Error:', error);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
  }
};

export const paidKundliManualPurchaseController = async (req, res) => {
  try {
    const {
      api_key,
      user_uni_id,
      paid_kundli_manual_id,
      offer_code = '',
      wallet_check = 0,
      payment_method,
    } = req.body;

    if (!api_key || !user_uni_id || !paid_kundli_manual_id) {
      return res.status(400).json({ status: 0, msg: 'api_key, user_uni_id and paid_kundli_manual_id are required' });
    }

    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) return res.json({ status: 0, error_code: 101, msg: 'Unauthorized User... Please login again' });

    const user = await User.findOne({
      where: { user_uni_id },
      include: [{ model: Customer, as: 'customer', required: false }],
      raw: true,
      nest: true,
    });

    const kundli = await PaidKundliManual.findOne({ where: { id: paid_kundli_manual_id, status: 1 } });
    if (!kundli || kundli.price <= 0) return res.json({ status: 0, msg: 'Invalid Kundli Manual Report' });

    const subtotal = kundli.price;
    const user_wallet_balance = await getTotalBalanceById(user_uni_id) || 0;

    let offer_amount = 0;
    const ref_disc_percentage = parseFloat(constants.astrologer_ref_discount_percentage || 0);
    let finalamount = subtotal;
    let wallet_amount = 0;
    let payable_amount = 0;

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

    const order_id = `KUNDM${Date.now()}`;

    if (wallet_check == 1 && wallet_amount > 0) {
      await Wallet.create({
        user_uni_id,
        gateway_order_id: order_id,
        reference_id: order_id,
        gateway_payment_id: '',
        transaction_code: 'remove_wallet_by_purchase_paid_kundli_manual',
        wallet_history_description: `Wallet deduction for Paid Kundli Manual #Rs. ${wallet_amount}`,
        transaction_amount: wallet_amount,
        amount: wallet_amount,
        main_type: 'dr',
        status: payable_amount === 0 ? 1 : 0,
        gst_amount: 0,
        payment_method: wallet_amount === finalamount ? 'wallet' : payment_method,
      });
    }

    const imageBase = process.env.IMAGE_BASE_URL_CUSTOMER || 'https://astro.synilogictech.com/';
    const defaultImg = process.env.DEFAULT_CUSTOMER_IMAGE || 'assets/img/customer.png';

    const customerData = {
      ...user.customer,
      customer_uni_id: user.user_uni_id,
      role_id: user.role_id,
      referral_code: user.referral_code,
      admin_id: user.admin_id,
      package_uni_id: user.package_uni_id,
      package_valid_date: user.package_valid_date,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country_code: user.country_code,
      country_name: user.country_name,
      user_fcm_token: user.user_fcm_token,
      firebase_auth_token: user.firebase_auth_token,
      customer_img: user.customer?.customer_img
        ? `${imageBase}${user.customer.customer_img}`
        : `${imageBase}${defaultImg}`,
      created_at: user.created_at,
      updated_at: user.updated_at,
      status: user.status,
    };

    const responseData = {
      paid_kundli_manual_id,
      report_type: 'paid_report',
      reference_id: '',
      ref_percentage: 0,
      reference_amount: 0,
      reference_tds_amount: 0,
      ref_disc_percentage,
      order_amount: subtotal,
      offer_amount,
      wallet_amount,
      subtotal,
      finalamount,
      recharge_gst_percent: gst_percent,
      recharge_gst_value: gst_value,
      payable_amount,
      my_wallet_amount: user_wallet_balance,
    };

    if (payable_amount === 0) {
      await PaidKundliManualOrder.create({
        order_id,
        paid_kundli_manual_id,
        user_uni_id,
        subtotal,
        offer_percent: offer?.discount_amount || 0,
        offer_amount,
        total_amount: 0,
        payment_status: '1',
        order_for: req.body.order_for || null,
        status: 1,
        request_body: JSON.stringify(req.body || {}),
        created_at: new Date(),
        updated_at: new Date(),
      });

      return res.json({
        status: 1,
        order_id,
        payment_gateway_status: 0,
        msg: 'Payment Successfully',
        data: responseData,
        customerData,
      });
    }

    if (payment_method === 'razorpay') {
      const gateway = new RazorpayApi();
      const gatewayResp = await gateway.createOrderId({ amount: payable_amount });
      if (gatewayResp.status !== 1) return res.status(500).json({ status: 0, msg: 'Razorpay error' });

      const gatewayData = {
        razorpay_id: gateway.razorpayId,
        order_id: gatewayResp.orderId,
        amount: payable_amount,
        currency: 'INR',
        email: user.email,
        phone: user.phone,
        name: user.name,
        logo: user.customer?.customer_img ? `${imageBase}${user.customer.customer_img}` : '62604.png',
        user_uni_id,
      };

      await PaidKundliManualOrder.create({
        order_id,
        paid_kundli_manual_id,
        user_uni_id,
        subtotal,
        offer_percent: offer?.discount_amount || 0,
        offer_amount,
        total_amount: payable_amount,
        status: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return res.json({
        status: 1,
        order_id,
        payment_gateway_status: 1,
        payment_gateway: gatewayData,
        msg: 'Payment Gateway Request',
        data: responseData,
        customerData,
      });
    } else {
      return res.status(400).json({ status: 0, msg: 'Unsupported or missing payment_method' });
    }

  } catch (err) {
    console.error('paidKundliManualPurchaseController Error:', err);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
  }
};


export const paidKundliManualOrderList = async (req, res) => {
 // await saveApiLogs(req.body);

  const {
    api_key,
    user_uni_id,
    offset = 0,
    order_for,
    report_type,
    limit,
  } = req.body;

  const pageLimit = limit || constants.api_page_limit;

  // Validation
  const errors = {};
  if (!api_key) errors.api_key = ['API key is required'];
  if (!user_uni_id) errors.user_uni_id = ['User unique ID is required'];

  if (Object.keys(errors).length > 0) {
    return res.json({
      status: 0,
      errors,
      message: 'Something went wrong',
      msg: Object.values(errors).flat().join('\n'),
    });
  }

  // Check API key
  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    const whereClause = {
      user_uni_id,
      payment_status: '1',
      ...(order_for && { order_for }),
      report_type: report_type || 'paid_report',
    };

    const results = await PaidKundliManualOrder.findAll({
      where: whereClause,
      include: [
        {
          model: PaidKundliManual,
          as: 'manual',
          attributes: ['title', 'description', 'paid_kundli_manual_image'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
      offset: Number(offset),
      limit: Number(pageLimit),
    });

    const lara_code_img_url = 'https://astronode.synilogic.in'; //for testing
   
    const imgBasePath = constants.image_base_url + constants.paid_kundli_manual_image_path;
    const defaultImage = constants.image_base_url + constants.default_paid_kundli_manual_image_path;

    const response = results.map(row => {
      const manual = row.manual || {};
      const img = manual.paid_kundli_manual_image
        ? imgBasePath + manual.paid_kundli_manual_image
        : defaultImage;

      return {
        id: row.id,
        paid_kundli_manual_id: row.paid_kundli_manual_id,
        user_uni_id: row.user_uni_id,
        order_id: row.order_id,
        subtotal: row.subtotal,
        reference_id: row.reference_id || '',
        reference_percent: row.reference_percent,
        reference_amount: row.reference_amount,
        offer_percent: row.offer_percent,
        offer_amount: row.offer_amount,
        request_body: row.request_body,
        response_body: row.response_body,
        pdf_file: row.pdf_file
  ? `${lara_code_img_url}${constants.paid_kundli_manual_pdf_path}${row.pdf_file}`
  : '',

        total_amount: row.total_amount,
        report_type: row.report_type,
        order_for: row.order_for,
        status: row.pdf_file ? 1 : 0,
        payment_status: row.payment_status,
        created_at: row.created_at ? moment(row.created_at).format('YYYY-MM-DD HH:mm:ss') : '',
        updated_at: row.updated_at ? moment(row.updated_at).format('YYYY-MM-DD HH:mm:ss') : '',
        title: manual.title || '',
        description: manual.description || '',
        paid_kundli_manual_image: img,
      };
    });

    if (response.length > 0) {
      return res.json({
        status: 1,
        offset: Number(offset) + pageLimit,
        data: response,
        msg: 'Get successfully',
      });
    } else {
      return res.json({
        status: 0,
        data: '',
        msg: 'No data found',
      });
    }
  } catch (error) {
    console.error('paidKundliManualOrderList Error:', error);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
  }
};
