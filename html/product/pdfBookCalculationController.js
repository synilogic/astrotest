// pdfBookCalculationController.js
import { PdfBook } from '../_models/pdfBookModel.js';
import Offer from '../_models/offers.js';
import User from '../_models/users.js';
import { getTotalBalanceById, checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';
import moment from 'moment';

export const pdfBookCalculation = async (req, res) => {
  try {
    const { api_key, user_uni_id, pdf_book_id, offer_code = '', wallet_check = 0 } = req.body;

    if (!api_key || !user_uni_id || !pdf_book_id) {
      return res.status(400).json({ status: 0, msg: 'api_key, user_uni_id and pdf_book_id are required' });
    }

    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) return res.json({ status: 0, error_code: 101, msg: 'Unauthorized User... Please login again' });

    const pdfBook = await PdfBook.findOne({ where: { id: pdf_book_id, status: 1 } });
    if (!pdfBook || pdfBook.price <= 0) return res.json({ status: 0, msg: 'Invalid Pdf Book' });

    const useramount = await getTotalBalanceById(user_uni_id) || 0;
    const subtotal = pdfBook.price;
    let offer_amount = 0, reference_amount = 0, wallet_amount = 0, payable_amount = 0, finalamount = subtotal;
    let reference_tds_amount = 0, reference_id = '', msg = '';
    const now = moment();

    const ref_percentage = parseFloat(constants.astrologer_ref_percentage || 0);
    const ref_disc_percentage = parseFloat(constants.astrologer_ref_discount_percentage || 0);

    if (offer_code) {
      const offer = await Offer.findOne({ where: { offer_code, status: 1 } });
      if (offer && now.isBetween(offer.offer_validity_from, offer.offer_validity_to)) {
        if (subtotal > offer.minimum_order_amount && subtotal <= offer.max_order_amount) {
          offer_amount = offer.offer_category === 'amount' ? offer.discount_amount : (subtotal * offer.discount_amount) / 100;
        } else {
          msg = subtotal < offer.minimum_order_amount ? `Minimum Order value ${offer.minimum_order_amount}` : `Maximum Order value ${offer.max_order_amount}`;
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

    if (constants.tds_on_reference === 1 && reference_amount > 0) {
      const tds = parseFloat(constants.tds || 0);
      reference_tds_amount = parseFloat(((tds * reference_amount) / 100).toFixed(2));
      reference_amount -= reference_tds_amount;
    }

    const data = {
      pdf_book_amount: parseFloat(subtotal.toFixed(2)),
      reference_id,
      ref_percentage: parseFloat(ref_percentage.toFixed(2)),
      reference_amount: parseFloat(reference_amount.toFixed(2)),
      reference_tds_amount: parseFloat(reference_tds_amount.toFixed(2)),
      ref_disc_percentage: parseFloat(ref_disc_percentage.toFixed(2)),
      offer_amount: parseFloat(offer_amount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      finalamount: parseFloat(finalamount.toFixed(2)),
      wallet_amount: parseFloat(wallet_amount.toFixed(2)),
      recharge_gst_percent: gst_percent,
      recharge_gst_value: gst_value,
      payable_amount: parseFloat(payable_amount.toFixed(2)),
      my_wallet_amount: parseFloat(useramount.toFixed(2)),
    };

    return res.json({ status: 1, data, msg: msg || 'Success' });

  } catch (error) {
    console.error('Error in pdfBookCalculation:', error);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
  }
};
