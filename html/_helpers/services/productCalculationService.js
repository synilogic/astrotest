
import { Op, Sequelize } from 'sequelize';
import dayjs from 'dayjs';
import WalletModel from '../../_models/wallet.js';
import OfferModel from '../../_models/offers.js';
import ProductModel from '../../_models/product.js';
import UserModel from '../../_models/users.js';
import { getConfig } from '../../configStore.js';

const getTotalBalanceById = async (user_uni_id) => {
  try {
    const [creditResult] = await WalletModel.findAll({
      where: { user_uni_id, main_type: 'cr', status: 1 },
      attributes: [[Sequelize.literal('SUM(amount / exchange_rate)'), 'total_cr']],
      raw: true
    });
    const [debitResult] = await WalletModel.findAll({
      where: { user_uni_id, main_type: 'dr', status: 1 },
      attributes: [[Sequelize.literal('SUM(amount / exchange_rate)'), 'total_dr']],
      raw: true
    });
    return Number(((parseFloat(creditResult?.total_cr) || 0) - (parseFloat(debitResult?.total_dr) || 0)).toFixed(2));
  } catch (error) {
    console.error("Error calculating wallet balance:", error);
    return 0;
  }
};

const getTotalBalanceGiftById = async (user_uni_id) => {
  try {
    const [creditResult] = await WalletModel.findAll({
      where: { user_uni_id, main_type: 'cr', status: 1, offer_status: 1 },
      attributes: [[Sequelize.literal('SUM(amount / exchange_rate)'), 'total_cr']],
      raw: true
    });
    const [debitResult] = await WalletModel.findAll({
      where: { user_uni_id, main_type: 'dr', status: 1, offer_status: 1 },
      attributes: [[Sequelize.literal('SUM(amount / exchange_rate)'), 'total_dr']],
      raw: true
    });
    return Number(((parseFloat(creditResult?.total_cr) || 0) - (parseFloat(debitResult?.total_dr) || 0)).toFixed(2));
  } catch (error) {
    console.error("Error calculating gift balance:", error);
    return 0;
  }
};

const getTotalBalanceMainById = async (user_uni_id) => {
  try {
    const [creditResult] = await WalletModel.findAll({
      where: { user_uni_id, main_type: 'cr', status: 1, offer_status: 0 },
      attributes: [[Sequelize.literal('SUM(amount / exchange_rate)'), 'total_cr']],
      raw: true
    });
    const [debitResult] = await WalletModel.findAll({
      where: { user_uni_id, main_type: 'dr', status: 1, offer_status: 0 },
      attributes: [[Sequelize.literal('SUM(amount / exchange_rate)'), 'total_dr']],
      raw: true
    });
    return Number(((parseFloat(creditResult?.total_cr) || 0) - (parseFloat(debitResult?.total_dr) || 0)).toFixed(2));
  } catch (error) {
    console.error("Error calculating main balance:", error);
    return 0;
  }
};

export const calculateProductDetails = async (input) => {
  const {
    user_uni_id,
    vendor_uni_id,
    product_id,
    item,
    reference_id,
    offer_code,
    wallet_check
  } = input;

  try {
    const vendordata = await UserModel.findOne({ where: { user_uni_id: vendor_uni_id, role_id: 5 } });
    if (!vendordata) return { status: 0, msg: 'Vendor account is inactive or invalid' };

    if (!item || Number(item) <= 0) return { status: 0, msg: 'Quantity must be at least one.' };

    const productcheck = await ProductModel.findOne({
      where: { id: product_id, vendor_uni_id, status: 1, price: { [Op.gt]: 0 } }
    });

    if (!productcheck) return { status: 0, msg: 'Product is invalid' };

    if (Number(item) > productcheck.quantity) {
      const msg = productcheck.quantity === 0 ? 'Product is Out Of Stock.' : `Only ${productcheck.quantity} quantity is available.`;
      return { status: 0, msg, available_quantity: productcheck.quantity };
    }

    const [useramount, wallet_gift_balance, wallet_total_balance] = await Promise.all([
      getTotalBalanceMainById(user_uni_id),
      getTotalBalanceGiftById(user_uni_id),
      getTotalBalanceById(user_uni_id)
    ]);

    let subtotal = productcheck.price * item;
    const gstvalue = productcheck.gst_percentage || 0;
    let wallet_amount = 0;
    let payable_amount = 0;
    let reference_amount = 0;
    let reference_disc_amount = 0;
    let offer_amount = 0;
    let coupon_status = "";
    let msg = "";

    const ref_percentage = Number(getConfig('astrologer_product_percentage') || 0);
    const ref_disc_percentage = Number(getConfig('astrologer_product_ref_discount_percentage') || 0);

        if (reference_id) {
      const astrologer = await UserModel.findOne({ where: { user_uni_id: reference_id, status: 1, role_id: 3 } });
      if (astrologer) {
        if (ref_percentage > 0) reference_amount = (subtotal * ref_percentage) / 100;
        if (ref_disc_percentage > 0) reference_disc_amount = (subtotal * ref_disc_percentage) / 100;
      }
      // If astrologer not found, just skip reference logic, do not return error
    }



    const offerData = offer_code ? await OfferModel.findOne({ where: { offer_code, status: 1 } }) : null;
    const curDate = dayjs();

  
    
  if (offerData) {
      const from = dayjs(offerData.offer_validity_from);
      const to = dayjs(offerData.offer_validity_to);
      if (curDate.isAfter(from.subtract(1, 'day')) && curDate.isBefore(to.add(1, 'day'))) {
        if (subtotal > offerData.minimum_order_amount) {

        if (offerData.offer_category === 'percentage'){
        
            offer_amount = parseFloat(subtotal * offerData.discount_amount) / 100;
           

          } else if (offerData.offer_category === 'amount'){
            offer_amount = parseFloat(offerData.discount_amount);
           
          }
          

          coupon_status = '1';
        } else {
          msg = subtotal < offerData.minimum_order_amount ? `Minimum Order value ${offerData.minimum_order_amount}` : `Maximum Order value ${offerData.max_order_amount}`;
          return { status: 0, msg };
        }
      } else {
        msg = 'Coupon code expiry';
        coupon_status = "0";
      }
    } else if (offer_code) {
      msg = 'Invalid Coupon code';
      coupon_status = "0";
    }

    if (offer_amount <= 0 && reference_disc_amount > 0) offer_amount = reference_disc_amount;
    subtotal -= offer_amount;

    const gstamount = gstvalue > 0 ? parseFloat(((subtotal * gstvalue) / 100).toFixed(2)) : 0;
    const finalamount = subtotal + gstamount;

    let finalamount_for_partition = finalamount - reference_amount;
    const admin_percentage = Number(getConfig('admin_product_percentage') || 0);
    const admin_amount = (finalamount_for_partition * admin_percentage) / 100;
    let vendor_amount = finalamount_for_partition - admin_amount;

    let reference_tds_amount = 0;
    let vendor_tds_amount = 0;
    const tds_on_purchase = getConfig('tds_on_product_purchase');
    if (tds_on_purchase == 1) {
      const tds = Number(getConfig('tds') || 0);
      reference_tds_amount = Math.round((tds * reference_amount) / 100 * 100) / 100;
      vendor_tds_amount = Math.round((tds * vendor_amount) / 100 * 100) / 100;
      reference_amount -= reference_tds_amount;
      vendor_amount -= vendor_tds_amount;
    }

    if (wallet_check && wallet_check == 1) {
      if (useramount >= finalamount) {
        wallet_amount = finalamount;
        payable_amount = 0;
      } else if (useramount > 0) {
        wallet_amount = useramount;
        payable_amount = finalamount - useramount;
      } else {
        wallet_amount = 0;
        payable_amount = finalamount;
      }
    } else {
      wallet_amount = 0;
      payable_amount = finalamount;
    }

    const data = {
      product_amount: productcheck.price,
      item: Number(item),
      reference_amount: Number(reference_amount.toFixed(2)),
      reference_tds_amount: Number(reference_tds_amount.toFixed(2)),
      ref_disc_percentage: Number(ref_disc_percentage.toFixed(2)),
      offer_ammount: Number(offer_amount.toFixed(2)),
      gstvalue: Number(gstvalue),
      gstamount: Number(gstamount.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      finalamount: Number(finalamount.toFixed(2)),
      wallet_amount: Number(wallet_amount.toFixed(2)),
      recharge_gst_percent: Number(gstvalue),
      recharge_gst_value: Number(gstamount),
      payable_amount: Number(payable_amount.toFixed(2)),
      admin_amount: Number(admin_amount.toFixed(2)),
      vendor_amount: Number(vendor_amount.toFixed(2)),
      vendor_tds_amount: Number(vendor_tds_amount.toFixed(2)),
      coupon_status,
      my_wallet_amount: Number(wallet_total_balance.toFixed(2)),
      wallet_gift_balance: Number(wallet_gift_balance.toFixed(2)),
      wallet_main_balance: Number(useramount.toFixed(2)),
    };

    return { status: 1, msg: msg || 'Success', data };
  } catch (err) {
    console.error('Error in calculateProductDetails:', err);
    return { status: 0, msg: 'Something went wrong' };
  }
};
