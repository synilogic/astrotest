// routes/banner.routes.js
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import db from "../_config/db.js";
import "../_models/index.js";
import WalletModel from '../_models/wallet.js';
import CustomerModel from '../_models/customers.js';
import UserModel from '../_models/users.js';
import {checkUserApiKey} from '../_helpers/common.js';

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




router.post("/getWalletBalance", upload.none(), async (req, res) => {
 
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
    // Step 2: Check API key authorization
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(200).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    // Step 3: Get wallet balance
    const amount_balance = await getTotalBalanceById(user_uni_id);
  
let is_anonymous_review=0;

const cust_data =await CustomerModel.findOne({
      where: { customer_uni_id: user_uni_id }
    });

if (cust_data) {
  is_anonymous_review = cust_data.is_anonymous_review;
}

    return res.json({
      status: 1,
      msg: 'Wallet Balance',
      data: amount_balance,
      is_anonymous_review:is_anonymous_review,
    });

  } catch (err) {
    console.error("getWalletBalance error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

export default router;
