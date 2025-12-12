import express from "express";
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import db from "../_config/db.js";
import { Op } from "sequelize";
import { checkUserApiKey } from "../_helpers/common.js";
import WalletModel from '../_models/wallet.js';
import Gift from "../_models/gifts.js";
import { constants } from "../_config/constants.js";

import { formatDateTime } from "../_helpers/dateTimeFormat.js";

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

// Route: /giftItem
router.post('/giftItem', upload.none(), async (req, res) => {
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
      msg: error.details.map(err => err.message).join('\n'),
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

const wallet_balance = await getTotalBalanceById(user_uni_id);

const gifts = await Gift.findAll({
  where: { status: 1 },
  order: [['gift_price', 'ASC']],
  raw: true,
});

const hostUrl = `${req.protocol}://${req.get("host")}/`;

const giftItems = gifts.map(gift => ({
  id: gift.id,
  gift_name: gift.gift_name,
  gift_price: gift.gift_price,
  gift_image: gift.gift_image
    ? `${hostUrl}${constants.gift_image_path}${gift.gift_image}`
    : '',
  status: gift.status,
  created_at: formatDateTime(gift.created_at),
  updated_at: formatDateTime(gift.updated_at),
}));

const result = giftItems.length > 0
  ? {
      status: 1,
      wallet_balance,
      data: giftItems,
      msg: 'Success',
    }
  : {
      status: 0,
      wallet_balance,
      msg: 'Something went wrong.. Try Again',
    };

return res.status(200).json(result);

  } catch (err) {
    console.error("Error in giftItem:", err);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong.. Try Again",
    });
  }
});

export default router;
