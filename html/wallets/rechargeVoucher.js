
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import db from "../_config/db.js";
import "../_models/index.js";
import WalletModel from '../_models/wallet.js';
import UserModel from '../_models/users.js';
import CurrencyModel from '../_models/currencies.js';
import RechargeVoucherModel from '../_models/recharge_vouchers.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import { Op } from 'sequelize';

dotenv.config();

const router = express.Router();
const upload = multer();

const getTotalBalanceById = async (uniId) => {
  try {
    const creditResult = await WalletModel.findAll({
      where: {
        user_uni_id: uniId,
        main_type: 'cr',
        status: 1
      },
      attributes: [[db.Sequelize.literal('SUM(amount / exchange_rate)'), 'total_cr']],
      raw: true
    });

    const debitResult = await WalletModel.findAll({
      where: {
        user_uni_id: uniId,
        main_type: 'dr',
        status: 1
      },
      attributes: [[db.Sequelize.literal('SUM(amount / exchange_rate)'), 'total_dr']],
      raw: true
    });

    const totalCr = parseFloat(creditResult[0].total_cr) || 0;
    const totalDr = parseFloat(debitResult[0].total_dr) || 0;

    return Number((totalCr - totalDr).toFixed(2));
  } catch (error) {
    console.error("Error calculating balance:", error);
    return 0;
  }
};

const isRecharged = async (user_uni_id) => {
  try {
    const wallet = await WalletModel.findOne({
      where: {
        user_uni_id,
        transaction_code: 'add_wallet',
        status: { [Op.in]: [0, 1] },
      }
    });

    return !!wallet;
  } catch (error) {
    console.error("Error in isRecharged:", error);
    return false;
  }
};

const isFirstUser = async (user_uni_id) => {
  try {
    const wallet = await WalletModel.findOne({
      where: { user_uni_id },
    });

    return !wallet; // true if first time (no wallet entries)
  } catch (error) {
    console.error("Error in isFirstUser:", error);
    return false;
  }
};

const getCurrency = async (user_uni_id) => {
  try {
    const user = await UserModel.findOne({
      where: { user_uni_id },
      attributes: ['country_code']
    });

    if (!user) throw new Error('User not found');

    const currency = await CurrencyModel.findOne({
      where: { country_code: user.country_code },
      attributes: ['currency_code']
    });

    if (!currency) throw new Error('Currency not found');

    return currency.currency_code;
  } catch (err) {
    console.error('Error in getCurrency:', err.message);
    return null;
  }
};

const getRechargeVouchers = async (user_uni_id, currency_code, isRechargedFlag) => {
  try {
    const newTagRecharge = getConfig('new_tag_recharge_for_new_customer');
    let tagFilter = {};

    if (newTagRecharge == 1) {
      const isFirst = await isFirstUser(user_uni_id);

      tagFilter = isFirst
        ? { tag: 'new' }
        : { tag: { [Op.ne]: 'new' } };

    } else {
      if (isRechargedFlag) {
        tagFilter = { tag: { [Op.ne]: 'new' } };
      }
    }

    const vouchers = await RechargeVoucherModel.findAll({
      where: {
        currency_code,
        status: 1,
        ...tagFilter
      },
      order: [['wallet_amount', 'ASC']],
      raw: true
    });

    const gstPercent = getConfig('gst') || 0;
    const currencySymbol = '₹';

   return vouchers.map(voucher => {
  const walletAmount = parseFloat(voucher.wallet_amount) || 0;
  const giftAmount = parseFloat(voucher.gift_amount) || 0;

  const gstAmount = parseFloat((walletAmount * gstPercent / 100).toFixed(2));
  const totalAmount = parseFloat((walletAmount + gstAmount).toFixed(2));
  const mainAmount = parseFloat((walletAmount + giftAmount).toFixed(2));

  return {
    ...voucher,
     wallet_cms_id: voucher.id,
    gstprecent: gstPercent,
    gstamount: gstAmount,
    totalamount: totalAmount,
    currency: currencySymbol,
    main_amount: mainAmount,
  };
});


  } catch (error) {
    console.error("Error fetching vouchers:", error);
    throw error;
  }
};

router.post("/rechargeVoucher", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      message: 'Validation failed',
      errors: error.details,
      msg: error.details.map(err => err.message).join('\n')
    });
  }

  const { api_key, user_uni_id } = req.body;

  try {
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const amount_balance = await getTotalBalanceById(user_uni_id);
    const is_recharged = await isRecharged(user_uni_id);
    const currency_code = await getCurrency(user_uni_id);

    if (!currency_code) {
      return res.status(400).json({ status: 0, msg: 'Currency not found' });
    }

    const vouchers = await getRechargeVouchers(user_uni_id, currency_code, is_recharged);

    if (vouchers.length > 0) {
      return res.json({
        status: 1,
        wallet: amount_balance,
        data: vouchers,
        msg: 'Result Found',
      });
    } else {
      return res.json({
        status: 0,
        msg: 'Data Not Found !!'
      });
    }

  } catch (err) {
    console.error("rechargeVoucher error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

export default router;
