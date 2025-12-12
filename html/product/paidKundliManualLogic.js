// logic/paidKundliManualLogic.js
import { PaidKundliManual } from '../_models/paidKundliManualModel.js';
import { Op } from 'sequelize';
import { constants } from '../_config/constants.js';
import User  from '../_models/users.js';
import  Offer  from '../_models/offers.js';
import { getTotalBalanceById } from '../_helpers/common.js';


export const paidKundliManualListLogic = async (params) => {
  try {
    const {
      search = '',
      offset = 0,
      report_type = '',
    } = params;

    const limit = constants.api_page_limit_secondary || 10;

    const whereClause = {
      status: '1',
      report_type: report_type || 'paid_report',
    };

    if (search && search.trim() !== '') {
      whereClause.title = { [Op.like]: `%${search.trim()}%` };
    }

    const result = await PaidKundliManual.findAll({
      where: whereClause,
      order: [['title', 'ASC']],
      offset: parseInt(offset),
      limit: parseInt(limit),
    });

    const baseUrl = constants.IMAGE_BASE_URL_PAID_KUNDLI_MANUAL || 'https://astro.synilogictech.com/uploads/paid_kundli_manual/';

    // Map image URLs
    const formattedResult = result.map((item) => {
      const itemJson = item.toJSON();
      itemJson.paid_kundli_manual_image = itemJson.paid_kundli_manual_image
        ? baseUrl + itemJson.paid_kundli_manual_image
        : null;
      return itemJson;
    });

    if (formattedResult.length > 0) {
      return {
        status: 1,
        offset: parseInt(offset) + limit,
        data: formattedResult,
        msg: 'Get successfully',
      };
    } else {
      return {
        status: 0,
        msg: 'No data found',
      };
    }
  } catch (err) {
    console.error('paidKundliManualListLogic Error:', err);
    return {
      status: 0,
      msg: 'Internal Server Error',
    };
  }
};

export const paidKundliManualCalculation = async (params) => {
  try {
    const {
      paid_kundli_manual_id,
      report_type = 'paid_report',
      reference_id = '',
      offer_code = '',
      wallet_check = 0,
      user_uni_id,
    } = params;

    const kundli = await PaidKundliManual.findOne({
      where: {
        id: paid_kundli_manual_id,
        report_type,
        status: 1,
      },
    });

    if (!kundli || kundli.price <= 0) {
      return { status: 0, msg: 'Order is invalid' };
    }

    const subtotal = kundli.price;
    const useramount = await getTotalBalanceById(user_uni_id) || 0;

    let reference_amount = 0;
    let reference_tds_amount = 0;
    let wallet_amount = 0;
    let payable_amount = 0;
    let finalamount = subtotal;
    let offer_amount = 0;
    let reference_disc_amount = 0;
    let msg = '';

    let ref_percentage = parseFloat(constants.astrologer_ref_percentage || 0);
    let ref_disc_percentage = parseFloat(constants.astrologer_ref_discount_percentage || 0);

    if (reference_id) {
      const astrologer = await User.findOne({
        where: { user_uni_id: reference_id, status: 1, role_id: 3 },
      });
      if (astrologer) {
        reference_amount = (subtotal * ref_percentage) / 100;
        reference_disc_amount = (subtotal * ref_disc_percentage) / 100;
      } else {
        msg = 'Invalid Reference Id';
        ref_percentage = 0;
        ref_disc_percentage = 0;
      }
    } else {
      ref_percentage = 0;
      ref_disc_percentage = 0;
    }

    if (offer_code) {
      const offer = await Offer.findOne({ where: { offer_code, status: 1 } });
      const now = moment();
      if (offer) {
        if (now.isBetween(moment(offer.offer_validity_from), moment(offer.offer_validity_to), null, '[]')) {
          if (subtotal > offer.minimum_order_amount) {
            if (subtotal <= offer.max_order_amount) {
              offer_amount = offer.offer_category === 'amount'
                ? offer.discount_amount
                : (subtotal * offer.discount_amount) / 100;
            } else {
              return { status: 0, msg: `Maximum Order value ${offer.max_order_amount}` };
            }
          } else {
            return { status: 0, msg: `Minimum Order value ${offer.minimum_order_amount}` };
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

    finalamount = subtotal - offer_amount;

    if (wallet_check == 1) {
      if (useramount >= finalamount) {
        wallet_amount = finalamount;
        payable_amount = 0;
      } else if (useramount > 0) {
        wallet_amount = useramount;
        payable_amount = finalamount - wallet_amount;
      } else {
        wallet_amount = 0;
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
    payable_amount += gst_value;

    if (constants.tds_on_reference == 1 && reference_amount > 0) {
      const tds = parseFloat(constants.tds || 0);
      reference_tds_amount = parseFloat(((tds * reference_amount) / 100).toFixed(2));
      reference_amount -= reference_tds_amount;
    }

    return {
      status: 1,
      data: {
        paid_kundli_manual_id: kundli.id,
        order_amount: subtotal,
        report_type: kundli.report_type,
        reference_id,
        ref_percentage,
        reference_amount: parseFloat(reference_amount.toFixed(2)),
        reference_tds_amount: parseFloat(reference_tds_amount.toFixed(2)),
        ref_disc_percentage,
        offer_amount: parseFloat(offer_amount.toFixed(2)),
        subtotal,
        finalamount: parseFloat(finalamount.toFixed(2)),
        wallet_amount: parseFloat(wallet_amount.toFixed(2)),
        recharge_gst_percent: gst_percent,
        recharge_gst_value: parseFloat(gst_value.toFixed(2)),
        payable_amount: parseFloat(payable_amount.toFixed(2)),
        my_wallet_amount: parseFloat(useramount.toFixed(2)),
      },
      msg: msg || 'Success',
    };
  } catch (err) {
    console.error('Error in paidKundliManualCalculationLogic:', err);
    return { status: 0, msg: 'Internal Server Error' };
  }
};