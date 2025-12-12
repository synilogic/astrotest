import moment from 'moment';
import { getConfig } from '../configStore.js';
import PaidKundliOrder from '../_models/paidKundliOrderModel.js';
import axios from 'axios';
import User from '../_models/users.js';
import Customer from '../_models/customers.js';
import Offer from '../_models/offers.js';
import Wallet from '../_models/wallet.js';
import RazorpayApi from '../_helpers/services/RazorpayApi.js';
import jyotishamAstro from '../_helpers/JyotishamAstro.js';
import {constants} from '../_config/constants.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// These two lines simulate __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import VedicAstro from '../_helpers/VedicAstro.js';
import { checkUserApiKey, getTotalBalanceById } from '../_helpers/common.js';
import Joi from "joi";


export const paidKundliManualPurchaseController = async (req, res) => {
  try {
         // Joi validation schema
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      order_for: Joi.string().valid('matching', 'horoscope').required(),
      offer_code: Joi.string().allow(null, ''),
      reference_id: Joi.string().allow(null, ''),
      wallet_check: Joi.number().allow(null),
      payment_method: Joi.string().required(),
      lang: Joi.string().required(),
      is_updated: Joi.any().optional(),

      // For matching
      boy_dob: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      boy_tob: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      boy_tz: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      boy_lat: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      boy_lon: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      girl_dob: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      girl_tob: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      girl_tz: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      girl_lat: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      girl_lon: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      boy_name: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      girl_name: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      boy_pob: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      girl_pob: Joi.when('order_for', {
        is: 'matching',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),

      // For horoscope
      name: Joi.when('order_for', {
        is: 'horoscope',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      dob: Joi.when('order_for', {
        is: 'horoscope',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      tob: Joi.when('order_for', {
        is: 'horoscope',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      lat: Joi.when('order_for', {
        is: 'horoscope',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      lon: Joi.when('order_for', {
        is: 'horoscope',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      tz: Joi.when('order_for', {
        is: 'horoscope',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      pob: Joi.when('order_for', {
        is: 'horoscope',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      pdf_type: Joi.when('order_for', {
        is: 'horoscope',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),

      // Both
      style: Joi.when('order_for', {
        is: Joi.valid('matching', 'horoscope'),
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      color: Joi.when('order_for', {
        is: Joi.valid('matching', 'horoscope'),
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
    });



    const {
      api_key,
      user_uni_id,
      offer_code = '',
      wallet_check = 0,
      payment_method,
      order_for,
      reference_id = '',
    } = req.body;

    if (!api_key || !user_uni_id || !order_for) {
      return res.status(400).json({ status: 0, msg: 'Missing required fields' });
    }

    const isValidUser = await checkUserApiKey(api_key, user_uni_id);
    if (!isValidUser) {
      return res.status(401).json({ status: 0, error_code: 101, msg: 'Unauthorized User... Please login again' });
    }

    const user = await User.findOne({
      where: { user_uni_id },
      include: [{ model: Customer, as: 'customer', required: false }],
      raw: true,
      nest: true,
    });

    // Step 1: Get Base Amount from Config
    const baseAmount = Number(await getConfig('kundli_manual_price')) || 100;
    const user_wallet_balance = await getTotalBalanceById(user_uni_id) || 0;

    // Step 2: Offer / Referral Discount
    const ref_disc_percentage = Number(await getConfig('astrologer_ref_discount_percentage')) || 0;
    let offer_amount = 0;

    const now = moment();
    if (offer_code) {
      const offer = await Offer.findOne({ where: { offer_code, status: 1 } });
      if (!offer) return res.json({ status: 0, msg: 'Invalid Coupon Code' });

      if (now.isBefore(moment(offer.offer_validity_from)) || now.isAfter(moment(offer.offer_validity_to))) {
        return res.json({ status: 0, msg: 'Coupon code expired' });
      }

      if (baseAmount <= offer.minimum_order_amount) {
        return res.json({ status: 0, msg: `Minimum order value is ${offer.minimum_order_amount}` });
      }

      if (baseAmount > offer.max_order_amount) {
        return res.json({ status: 0, msg: `Maximum order value is ${offer.max_order_amount}` });
      }

      offer_amount = offer.offer_category === 'amount'
        ? Number(offer.discount_amount)
        : (baseAmount * Number(offer.discount_amount)) / 100;
    } else if (ref_disc_percentage > 0 && reference_id) {
      const refUser = await User.findOne({ where: { user_uni_id: reference_id, role_id: 3, status: 1 } });
      if (refUser) {
        offer_amount = (baseAmount * ref_disc_percentage) / 100;
      }
    }

    // Step 3: Calculate Final Amount
    let finalamount = baseAmount - offer_amount;
    finalamount = Math.max(0, parseFloat(finalamount.toFixed(2)));

    // Step 4: Wallet Adjustment
    let wallet_amount = 0;
    let payable_amount = finalamount;

    if (wallet_check == 1) {
      if (user_wallet_balance >= finalamount) {
        wallet_amount = finalamount;
        payable_amount = 0;
      } else if (user_wallet_balance > 0) {
        wallet_amount = user_wallet_balance;
        payable_amount = finalamount - wallet_amount;
      }
    }

    // Step 5: GST Calculation
    const gst_percent = Number(await getConfig('gst')) || 18;
    let gst_value = 0;

    if (payable_amount > 0) {
      gst_value = parseFloat(((payable_amount * gst_percent) / 100).toFixed(2));
    }

    payable_amount = parseFloat((payable_amount + gst_value).toFixed(2));

    // Step 6: Generate Order ID
    const order_id = `KUND${Date.now().toString().slice(-5)}`;

    // Step 7: Wallet Entry
    if (wallet_check == 1 && wallet_amount > 0) {
      await Wallet.create({
        user_uni_id,
        gateway_order_id: order_id,
        reference_id: order_id,
        transaction_code: 'remove_wallet_by_purchase_paid_kundli_manual',
        wallet_history_description: `Wallet deduction for Paid Kundli Manual Rs.${wallet_amount}`,
        transaction_amount: wallet_amount,
        amount: wallet_amount,
        main_type: 'dr',
        gst_amount: 0,
        status: payable_amount === 0 ? 1 : 0,
        payment_method: wallet_amount === finalamount ? 'wallet' : payment_method,
      });
    }

    // Step 8: Prepare Customer Data
    const imageBase = process.env.IMAGE_BASE_URL_CUSTOMER || 'https://astro.synilogictech.com/';
    const defaultImg = process.env.DEFAULT_CUSTOMER_IMAGE || 'assets/img/customer.png';
    const rawImage = user.customer?.customer_img || defaultImg;
    const formattedImg = rawImage.startsWith('http') ? rawImage : `${imageBase}${rawImage}`;

    const customerData = {
      ...user.customer,
      customer_uni_id: user.user_uni_id,
      role_id: user.role_id,
      referral_code: user.referral_code,
      admin_id: user.admin_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      customer_img: formattedImg,
      created_at: moment(user.created_at).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment(user.updated_at).format('YYYY-MM-DD HH:mm:ss'),
      status: user.status,
    };

    const responseData = {
      order_amount: baseAmount.toFixed(2),
      reference_id,
      ref_percentage: 0,
      reference_amount: 0,
      reference_tds_amount: 0,
      ref_disc_percentage,
      offer_amount: parseFloat(offer_amount.toFixed(2)),
      finalamount: finalamount.toFixed(2),
      wallet_amount: parseFloat(wallet_amount.toFixed(2)),
      recharge_gst_percent: gst_percent,
      recharge_gst_value: gst_value.toFixed(2),
      payable_amount: payable_amount.toFixed(2),
      my_wallet_amount: user_wallet_balance,
    };

    // Step 9: Payment Handling
    if (payable_amount == 0) {
      const order11 = await PaidKundliOrder.create({
        order_id,
        user_uni_id,
        subtotal: baseAmount.toString(),
        offer_percent: offer_code ? Number(offer_code.discount_amount || 0) : 0,
        offer_amount,
        total_amount: 0,
        payment_status: 1,
        order_for: order_for || null,
        status: 0,
        request_body: JSON.stringify(req.body),
        created_at: new Date(),
        updated_at: new Date(),
      });

     const result = await paidKundliPDFGenerate(order11.order_id);
        console.log("hello result",result)
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

      if (gatewayResp.status !== 1) {
        return res.status(500).json({ status: 0, msg: 'Razorpay error' });
      }

      await PaidKundliOrder.create({
        order_id,
        user_uni_id,
        subtotal: baseAmount.toString(),
        offer_percent: offer_code ? Number(offer_code.discount_amount || 0) : 0,
        offer_amount,
        total_amount: payable_amount,
        payment_status: 0,
        order_for: order_for || null,
        status: 0,
        request_body: JSON.stringify(req.body),
        created_at: new Date(),
        updated_at: new Date(),
      });

      const gatewayData = {
        phone: user.phone,
        amount: payable_amount,
        razorpay_id: gateway.razorpayId,
        user_uni_id,
        logo: formattedImg,
        email: user.email,
        name: user.name,
        order_id: gatewayResp.orderId,
      };

      return res.json({
        status: 1,
        order_id,
        payment_gateway_status: 1,
        payment_gateway: gatewayData,
        msg: 'Payment Gateway Request',
        data: responseData,
        customerData,
      });
    }

   
    return res.status(400).json({ status: 0, msg: 'Unsupported or missing payment_method' });
  } catch (err) {
    console.error('paidKundliManualPurchaseController Error:', err);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
  }
};


async function paidKundliPDFGenerate(order_id) {
  const result = {};
  const paidKundliDetail = await PaidKundliOrder.findOne({
    where: { order_id, status: 0 }
  });
      // console.log("jiji",paidKundliDetail);
  if (!paidKundliDetail || !paidKundliDetail.request_body) {
    return {
      status: 0,
      msg: 'Already pdf generated',
    };
  }

  if (paidKundliDetail.payment_status !== 1) {
    return {
      status: 0,
      msg: 'For this request payment is pending',
    };
  }

  const request_body = JSON.parse(paidKundliDetail.request_body);
  const order_for = paidKundliDetail.order_for;

  let resp = { status: '', response: '', downloadUrl: '' };

  if (order_for === 'matching') {
    resp = await vedicAstro.matchingPDF(request_body);
    console.log("hello resp",resp)
  } else if (order_for === 'horoscope') {
    const kundliApiStatus = await getConfig('kundli_api_status');
    if (kundliApiStatus == 3) {
      //const clss = new VedicAstro();
      
      resp = await jyotishamAstro.horoscopePDF(request_body);
     // resp =  await clss.horoscopePDF(request_body);
     
    } else {
      resp = await VedicAstro.horoscopePDF(request_body);
    }
  }

  if (
    resp.status == 200 &&
    (resp.response || resp.downloadUrl)
  ) {
    const pdfUrl = resp.downloadUrl || resp.response;

    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
    });

    const folderPath = path.join(__dirname, '../public', constants.paid_kundli_path);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
       
    const fileName = `${order_for}_${order_id}_${Date.now()}.pdf`;
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, response.data);

    if (fs.existsSync(filePath)) {
      await paidKundliDetail.update({
        status: 1,
        pdf_file: fileName,
      });

      return {
        status: 1,
        msg: 'Successfully pdf generated.',
      };
    } else {
      await paidKundliDetail.increment('attempt');
      return {
        status: 0,
        msg: 'Failed to generate pdf',
      };
    }
  } else {
    await paidKundliDetail.increment('attempt');
    return {
      status: 0,
      msg: 'Failed to generate pdf',
    };
  }
}
