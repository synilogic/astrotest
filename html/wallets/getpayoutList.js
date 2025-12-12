// routes/banner.routes.js
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from 'joi';
import db from '../_config/db.js';
import '../_models/index.js';
import WalletModel from '../_models/wallet.js';
import { checkUserApiKey } from '../_helpers/common.js';

dotenv.config();

const router = express.Router();
const upload = multer();

router.post('/getpayoutList', upload.none(), async (req, res) => {
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
      msg: error.details.map((err) => err.message).join('\n'),
    });
  }

  const { api_key, user_uni_id } = req.body;

  try {
    // Check if API key is valid for the given user
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    // Fetch payout wallet transactions
    const walletRecords = await WalletModel.findAll({
      where: {
        user_uni_id: user_uni_id,
        transaction_code: 'remove_wallet_by_payout',
      },
      order: [['created_at', 'DESC']],
    });

    if (walletRecords && walletRecords.length > 0) {
      return res.json({
        status: 1,
        data: walletRecords,
        msg: 'List',
      });
    } else {
      return res.json({
        status: 0,
        msg: 'No records found',
      });
    }
  } catch (err) {
    console.error('getpayoutList Error:', err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;
