// switchwordCalculationController.js

import SwitchWord from '../_models/switchword.js';
import  { SwitchWordOrder }  from '../_models/switchwordOrder.js';
import User from '../_models/users.js';
import Offer from '../_models/offers.js';
import { getTotalBalanceById, checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';
import moment from 'moment';

export const switchwordCalculation = async (req, res) => {
  try {
    const {
      api_key,
      user_uni_id,
      switchword_id,
      offer_code = '',
      wallet_check = 0,
    } = req.body;

    if (!api_key || !user_uni_id || !switchword_id) {
      return res.status(400).json({
        status: 0,
        msg: 'api_key, user_uni_id and switchword_id are required',
      });
    }

    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      return res.json({ status: 0, error_code: 101, msg: 'Unauthorized User... Please login again' });
    }

    const switchword = await SwitchWord.findOne({ where: { id: switchword_id } });
    if (!switchword || switchword.price <= 0) {
      return res.json({ status: 0, msg: 'Invalid Switchword' });
    }

    const useramount = await getTotalBalanceById(user_uni_id) || 0;
    const subtotal = switchword.price;
    let offer_amount = 0;
    let wallet_amount = 0;
    let payable_amount = 0;
    let finalamount = subtotal;
    const ref_disc_percentage = parseFloat(constants.astrologer_ref_discount_percentage || 0);
    const now = moment();
    let msg = '';

    if (offer_code) {
      const offer = await Offer.findOne({ where: { offer_code, status: 1 } });
      if (offer && now.isBetween(moment(offer.offer_validity_from), moment(offer.offer_validity_to), null, '[]')) {
        if (subtotal > offer.minimum_order_amount && subtotal <= offer.max_order_amount) {
          offer_amount = offer.offer_category === 'amount'
            ? offer.discount_amount
            : (subtotal * offer.discount_amount) / 100;
        } else {
          msg = subtotal < offer.minimum_order_amount
            ? `Minimum Order value ${offer.minimum_order_amount}`
            : `Maximum Order value ${offer.max_order_amount}`;
        }
      } else {
        msg = 'Invalid or expired coupon code';
      }
    }

    if (offer_amount <= 0 && ref_disc_percentage > 0) {
      offer_amount = (subtotal * ref_disc_percentage) / 100;
    }

    finalamount = parseFloat((subtotal - offer_amount).toFixed(2));

    if (wallet_check == 1) {
      if (useramount >= finalamount) {
        wallet_amount = finalamount;
        payable_amount = 0;
      } else if (useramount > 0) {
        wallet_amount = useramount;
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

    const data = {
      switchword_amount: parseFloat(subtotal.toFixed(2)),
      offer_amount: parseFloat(offer_amount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      finalamount: parseFloat(finalamount.toFixed(2)),
      wallet_amount: parseFloat(wallet_amount.toFixed(2)),
      recharge_gst_percent: gst_percent,
      recharge_gst_value: gst_value,
      payable_amount: parseFloat(payable_amount.toFixed(2)),
      my_wallet_amount: parseFloat(useramount.toFixed(2)),
    };

    return res.json({
      status: 1,
      data,
      msg: msg || 'Success',
    });
  } catch (error) {
    console.error('Error in switchwordCalculation:', error);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
  }
};
