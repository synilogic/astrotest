// routes/getWalletTransactions.js
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from 'joi';
import db from '../_config/db.js';
import '../_models/index.js';
import WalletModel from '../_models/wallet.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { formatDateTime } from '../_helpers/dateTimeFormat.js';

dotenv.config();

const router = express.Router();
const upload = multer();

router.post('/getWalletTransactions', upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional().default(0),
    limit: Joi.number().integer().min(1).max(100).optional().default(50),
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

  const { api_key, user_uni_id, offset = 0, limit = 50 } = req.body;

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

    // Fetch all wallet transactions for the user
    const walletRecords = await WalletModel.findAll({
      where: {
        user_uni_id: user_uni_id,
      },
      order: [['created_at', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit),
      raw: true,
    });

    // Format the transactions
    const formattedTransactions = walletRecords.map((record, index) => {
      const amount = parseFloat(record.amount || 0);
      const exchangeRate = parseFloat(record.exchange_rate || 1);
      const finalAmount = (amount / exchangeRate).toFixed(2);
      
      return {
        id: record.id,
        sn: offset + index + 1,
        referenceId: record.reference_id || '-',
        paymentId: record.payment_id || '-',
        date: record.created_at ? formatDateTime(record.created_at) : '-',
        amount: `₹${finalAmount}`,
        type: record.main_type || record.type || 'cr', // 'cr' for credit, 'dr' for debit
        narration: record.wallet_history_description || record.narration || '-',
        status: record.status === 1 ? 'Complete' : 'Pending',
        created_at: record.created_at,
        transaction_code: record.transaction_code || '',
      };
    });

    if (walletRecords && walletRecords.length > 0) {
      return res.json({
        status: 1,
        data: formattedTransactions,
        msg: 'Wallet transactions list',
      });
    } else {
      return res.json({
        status: 1,
        data: [],
        msg: 'No transactions found',
      });
    }
  } catch (err) {
    console.error('getWalletTransactions Error:', err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;

