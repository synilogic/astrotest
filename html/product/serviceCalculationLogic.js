
import  User  from '../_models/users.js';
import { ServiceAssign } from '../_models/serviceAssign.js';
import  Offer  from '../_models/offers.js';
import { getTotalBalanceMainById, getTotalBalanceGiftById, getTotalBalanceById } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';
import moment from 'moment';

export  const serviceCalculationLogic = async (params) => {
    let msg = '';
    const curDate = moment();

    const customer = await User.findOne({ where: { user_uni_id: params.customer_uni_id } });
    const astrologer = await User.findOne({ where: { user_uni_id: params.astrologer_uni_id, status: 1, role_id: 3 } });
    const service = await ServiceAssign.findOne({ where: { id: params.service_assign_id, status: 1 } });

    const useramount = await getTotalBalanceMainById(params.customer_uni_id) || 0;
    const walletGift = await getTotalBalanceGiftById(params.customer_uni_id) || 0;
    const walletTotal = await getTotalBalanceById(params.customer_uni_id) || 0;

    if (!astrologer) {
        return { status: 0, msg: 'Astrologer account is inactive or invalid' };
    }

    if (!service) {
        return { status: 0, msg: 'Service is invalid' };
    }

    let subtotal = service.price;
    let reference_amount = 0;
    let offer_amount = 0;
    let coupon_status = '';
    let offerData = null;

    if (params.offer_code) {
        offerData = await Offer.findOne({ where: { offer_code: params.offer_code, status: 1 } });
        if (offerData) {
            if (curDate.isBetween(moment(offerData.offer_validity_from), moment(offerData.offer_validity_to), null, '[]')) {
                if (subtotal > offerData.minimum_order_amount && subtotal < offerData.max_order_amount) {
                    if (offerData.offer_category === 'amount') {
                        offer_amount = offerData.discount_amount;
                        coupon_status = '1';
                    } else if (offerData.offer_category === 'percentage') {
                        offer_amount = subtotal * offerData.discount_amount / 100;
                        coupon_status = '1';
                    }
                } else {
                    if (subtotal < offerData.minimum_order_amount) {
                        msg = `Minimum Order value ${offerData.minimum_order_amount}`;
                    } else if (subtotal > offerData.max_order_amount) {
                        msg = `Maximum Order value ${offerData.max_order_amount}`;
                    } else {
                        msg = 'Coupon code expiry';
                    }
                }
            } else {
                msg = 'Invalid Coupon code';
            }
        } else {
            msg = 'Invalid Coupon code';
        }
    }

    const finalamount = subtotal - reference_amount - offer_amount;

    const admin_percentage = constants.ADMIN_SERVICE_PERCENTAGE || 20;
    let admin_amount = finalamount * admin_percentage / 100;
    let astrologer_amount = finalamount - admin_amount;

    let astrologer_tds_amount = 0;
    if (constants.TDS_ON_SERVICE_PURCHASE === 1) {
        const tds = constants.TDS || 5;
        astrologer_tds_amount = parseFloat(((tds * astrologer_amount) / 100).toFixed(2));
        astrologer_amount -= astrologer_tds_amount;
    }

    let wallet_amount = 0;
    let payable_amount = finalamount;

    if (params.wallet_check == 1) {
        if (useramount >= finalamount) {
            wallet_amount = finalamount;
            payable_amount = 0;
        } else if (useramount > 0) {
            wallet_amount = useramount;
            payable_amount = finalamount - useramount;
        }
    }

    const recharge_gst_percent = constants.GST || 18;
    let recharge_gst_value = 0;
    if (payable_amount > 0 && recharge_gst_percent > 0) {
        recharge_gst_value = parseFloat(((payable_amount * recharge_gst_percent) / 100).toFixed(2));
    }

    payable_amount += recharge_gst_value;

    const data = {
        service_amount: parseFloat(service.price) || 0,
        reference_amount: parseFloat(reference_amount.toFixed(2)),
        offer_ammount: parseFloat(offer_amount.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        finalamount: parseFloat(finalamount.toFixed(2)),
        wallet_amount: parseFloat(wallet_amount.toFixed(2)),
        recharge_gst_percent,
        recharge_gst_value: parseFloat(recharge_gst_value.toFixed(2)),
        payable_amount: parseFloat(payable_amount.toFixed(2)),
        admin_amount: parseFloat(admin_amount.toFixed(2)),
        astrologer_amount: parseFloat(astrologer_amount.toFixed(2)),
        astrologer_tds_amount: parseFloat(astrologer_tds_amount.toFixed(2)),
        coupon_status: `${coupon_status}`,
        admin_percentage,
        my_wallet_amount: parseFloat(walletTotal.toFixed(2)),
        wallet_gift_balance: parseFloat(walletGift.toFixed(2)),
        wallet_main_balance: parseFloat(useramount.toFixed(2)),
    };

    return {
        status: 1,
        data,
        msg: msg || 'Success',
    };
};
