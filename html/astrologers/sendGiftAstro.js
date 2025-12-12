import express from "express";
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import db from "../_config/db.js";
import { Op, Sequelize } from "sequelize";
import { checkUserApiKey, getCurrency, getAstrologerById } from '../_helpers/common.js';
import WalletModel from '../_models/wallet.js';
import Gift from "../_models/gifts.js";
import { constants, CURRENCY } from "../_config/constants.js";
import { getConfig } from '../configStore.js';

import { formatDateTime } from "../_helpers/dateTimeFormat.js";
import OfferModel from '../_models/offers.js';
import AstrologerGift from '../_models/astrologer_gifts.js';

dotenv.config();
const router = express.Router();
const upload = multer();

// Utility to get total wallet balance
const getTotalBalanceById = async (uniId) => {
  try {
    const [creditResult] = await WalletModel.findAll({
      where: { user_uni_id: uniId, main_type: 'cr', status: 1 },
      attributes: [[db.Sequelize.literal('SUM(amount / exchange_rate)'), 'total_cr']],
      raw: true,
    });

    const [debitResult] = await WalletModel.findAll({
      where: { user_uni_id: uniId, main_type: 'dr', status: 1 },
      attributes: [[db.Sequelize.literal('SUM(amount / exchange_rate)'), 'total_dr']],
      raw: true,
    });

    const totalCr = parseFloat(creditResult.total_cr) || 0;
    const totalDr = parseFloat(debitResult.total_dr) || 0;

    return Number((totalCr - totalDr).toFixed(2));
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

router.post('/sendGiftAstro', upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    gift_id: Joi.required(),
    livechannel: Joi.any().optional()
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 0,
      message: 'Validation failed',
      errors: error.details,
      msg: error.details.map(err => err.message).join('\n'),
    });
  }

  const { api_key, user_uni_id, astrologer_uni_id, gift_id, livechannel } = req.body;

  try {
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const cutCurrencyInfo = await getCurrency(user_uni_id, 'all');
    const AstCurrencyInfo = await getCurrency(astrologer_uni_id, 'all');
    const default_currency_code = CURRENCY.default_currency_code;

    if (cutCurrencyInfo.currency_code !== default_currency_code || AstCurrencyInfo.currency_code !== default_currency_code) {
      return res.status(200).json({
        status: 0,
        msg: 'This feature is not available for this country or astrologer',
      });
    }

    const gift = await Gift.findOne({ where: { id: gift_id, status: 1 } });
    if (!gift) {
      return res.status(200).json({ status: 0, msg: 'Invalid gift Id' });
    }

    const useAmount = parseFloat(gift.gift_price);
    const currency = '₹';
    const amount_balance = await getTotalBalanceById(user_uni_id);

    if (!(amount_balance > 0 && useAmount > 0 && amount_balance >= useAmount)) {
      return res.status(200).json({ status: 0, msg: "Customer Amount is Low" });
    }

    const wallet_gift_balance = await getTotalBalanceGiftById(user_uni_id);
    let deduct = 0;
    let offer_amount = 0;

    const offerStatus = await getConfig('offer_amount_status_on_gift');
    if (offerStatus) {
      if (useAmount <= wallet_gift_balance) {
        offer_amount = useAmount;
      } else {
        offer_amount = wallet_gift_balance;
        deduct = useAmount - offer_amount;
      }
    } else {
      deduct = useAmount;
    }

    let des = `${useAmount} ${currency} Gift Charge For ${gift.gift_name} To Astrologer`;

    if (offer_amount > 0) {
      await WalletModel.create({
        user_uni_id,
        transaction_code: 'remove_wallet_by_gift_offer',
        gateway_payment_id:'',
        wallet_history_description: des,
        transaction_amount: offer_amount,
        main_type: 'dr',
        amount: offer_amount,
        reference_id: gift.id,
        status: 1,
        offer_status: 1
      });
    }

    if (deduct > 0) {
      await WalletModel.create({
        user_uni_id,
        transaction_code: 'remove_wallet_by_gift',
        gateway_payment_id:'',
        wallet_history_description: des,
        transaction_amount: deduct,
        main_type: 'dr',
        amount: deduct,
        reference_id: gift.id,
        status: 1
      });
    }

    const astroDetail = await getAstrologerById(astrologer_uni_id);
    let admin_percentage = 0;
    const isAdminPercentEnabled = await getConfig('admin_percentage_on_gift_send');
    const globalAdminPercentage = await getConfig('admin_percentage');

    if (isAdminPercentEnabled == 1) {
      if (astroDetail?.admin_percentage && parseInt(astroDetail.admin_percentage) > 0) {
        admin_percentage = astroDetail.admin_percentage;
      } else if (!isNaN(globalAdminPercentage)) {
        admin_percentage = parseFloat(globalAdminPercentage);
      }
    }

    let tds = 0;
    const isTdsEnabled = await getConfig('tds_on_gift_send');
    const tdsConfig = await getConfig('tds');
    if (isTdsEnabled == 1 && !isNaN(tdsConfig)) {
      tds = parseFloat(tdsConfig);
    }

    let tds_amount = 0, admin_amount = 0, astroAmount = 0;
    if (deduct > 0) {
      if (admin_percentage > 0) {
        admin_amount = (deduct * admin_percentage) / 100;
      }
      deduct -= admin_amount;
      if (tds > 0) {
        tds_amount = parseFloat(((tds * deduct) / 100).toFixed(2));
      }
      astroAmount = deduct - tds_amount;
      des = `${deduct} ${currency} Gift Amount For ${gift.gift_name} From User.`;
    } else {
      des = `Gift ${gift.gift_name} From User.`;
    }

    await WalletModel.create({
      user_uni_id: astrologer_uni_id,
      transaction_code: 'add_wallet_by_gift',
      gateway_payment_id:'',
      wallet_history_description: des,
      transaction_amount: astroAmount,
      amount: astroAmount,
      main_type: 'cr',
      reference_id: gift.id,
      tds_amount,
      admin_percentage,
      admin_amount,
      offer_amount,
      status: 1
    });

    await AstrologerGift.create({
      user_id: user_uni_id,
      astrologer_uni_id:astrologer_uni_id,
      amount: useAmount,
      gift_id: gift.id,
      livechannel
    });

    return res.status(200).json({
      status: 1,
      msg: 'Send Gift Successfully'
    });
  } catch (err) {
    console.error("Error in sendGiftAstro:", err);
    return res.status(500).json({ status: 0, msg: "Something went wrong.. Try Again" });
  }
});

export default router;
