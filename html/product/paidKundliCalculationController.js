import moment from 'moment';
import { checkUserApiKey, getTotalBalanceById } from '../_helpers/common.js';
import User from '../_models/users.js';
import Offer from '../_models/offers.js';
import { getConfig } from '../configStore.js';

export const paidKundliCalculation = async (req, res) => {
  const {
    api_key,
    user_uni_id,
    order_for,
    offer_code = '',
    wallet_check = 0,
    reference_id = '',
  } = req.body;

  if (!api_key || !user_uni_id || !order_for) {
    return res.status(400).json({ status: 0, msg: 'Missing required fields' });
  }

  try {
    const isValidUser = await checkUserApiKey(api_key, user_uni_id);
    if (!isValidUser) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const curDate = moment();

    let priceCheck = 0;
    if (order_for === 'matching') {
      priceCheck = Number(await getConfig('kundli_matching_price'));
    } else if (order_for === 'horoscope') {
      priceCheck = Number(await getConfig('horoscope_price'));
    }

    if (!priceCheck || priceCheck <= 0) {
      return res.status(400).json({ status: 0, msg: 'Order is invalid' });
    }

    const subtotal = priceCheck;
    const useramount = Number(await getTotalBalanceById(user_uni_id)) || 0;

    let reference_amount = 0;
    let reference_tds_amount = 0;
    let offer_amount = 0;
    let reference_disc_amount = 0;

    const ref_percentage = Number(await getConfig('astrologer_ref_percentage')) || 0;
    const ref_disc_percentage = Number(await getConfig('astrologer_ref_discount_percentage')) || 0;

    let msg = '';

    if (reference_id) {
      const astrologer = await User.findOne({
        where: { user_uni_id: reference_id, status: 1, role_id: 3 },
      });

      if (astrologer) {
        if (ref_percentage > 0) reference_amount = (subtotal * ref_percentage) / 100;
        if (ref_disc_percentage > 0) reference_disc_amount = (subtotal * ref_disc_percentage) / 100;
      } else {
        msg = 'Invalid Reference Id';
      }
    }

    if (offer_code) {
      const offer = await Offer.findOne({
        where: { offer_code, status: 1 },
      });

      if (offer) {
        const offerFrom = moment(offer.offer_validity_from);
        const offerTo = moment(offer.offer_validity_to);

        if (curDate.isBefore(offerFrom) || curDate.isAfter(offerTo)) {
          msg = 'Coupon code expiry';
        } else if (subtotal <= offer.minimum_order_amount) {
          return res.status(400).json({
            status: 0,
            msg: `Minimum Order value ${offer.minimum_order_amount}`,
          });
        } else if (subtotal > offer.max_order_amount) {
          return res.status(400).json({
            status: 0,
            msg: `Maximum Order value ${offer.max_order_amount}`,
          });
        } else {
          offer_amount = offer.offer_category === 'amount'
            ? Number(offer.discount_amount)
            : (subtotal * Number(offer.discount_amount)) / 100;
        }
      } else {
        msg = 'Invalid Coupon code';
      }
    }

    if (offer_amount <= 0 && reference_disc_amount > 0) {
      offer_amount = reference_disc_amount;
    }

    let finalamount = subtotal - offer_amount;
    finalamount = Math.max(0, finalamount);

    let wallet_amount = 0;
    let payable_amount = finalamount;

    if (wallet_check == 1) {
      if (useramount >= finalamount) {
        wallet_amount = finalamount;
        payable_amount = 0;
      } else if (useramount > 0) {
        wallet_amount = useramount;
        payable_amount = finalamount - useramount;
      }
    }

    const recharge_gst_percent = Number(await getConfig('gst')) || 0;
    let recharge_gst_value = 0;

    if (payable_amount > 0 && recharge_gst_percent > 0) {
      recharge_gst_value = parseFloat(((payable_amount * recharge_gst_percent) / 100).toFixed(2));
    }

    payable_amount += recharge_gst_value;
    payable_amount = Math.max(0, parseFloat(payable_amount.toFixed(2)));

    const tdsEnabled = Number(await getConfig('tds_on_reference')) === 1;
    if (tdsEnabled) {
      const tds = Number(await getConfig('tds')) || 0;
      if (tds > 0) {
        reference_tds_amount = parseFloat(((tds * reference_amount) / 100).toFixed(2));
        reference_amount -= reference_tds_amount;
      }
    }

    const data = {
      order_amount: priceCheck.toFixed(2),
      reference_id: reference_id || '',
      ref_percentage: parseFloat(ref_percentage.toFixed(2)),
      reference_amount: parseFloat(reference_amount.toFixed(2)),
      reference_tds_amount: parseFloat(reference_tds_amount.toFixed(2)),
      ref_disc_percentage: parseFloat(ref_disc_percentage.toFixed(2)),
      offer_amount: parseFloat(offer_amount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      finalamount: parseFloat(finalamount.toFixed(2)),
      wallet_amount: parseFloat(wallet_amount.toFixed(2)),
      recharge_gst_percent: parseFloat(recharge_gst_percent.toFixed(2)),
      recharge_gst_value: parseFloat(recharge_gst_value.toFixed(2)),
      payable_amount: parseFloat(payable_amount.toFixed(2)),
      my_wallet_amount: parseFloat(useramount.toFixed(2)),
    };

    return res.status(200).json({
      status: 1,
      data,
      msg: msg || 'Success',
    });
  } catch (err) {
    console.error('Error in paidKundliCalculation:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Internal Server Error',
    });
  }
};
