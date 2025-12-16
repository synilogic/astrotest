// walletList.js
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from 'joi';
import { Op } from 'sequelize';
import WalletModel from '../_models/wallet.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { formatDateTime } from '../_helpers/dateTimeFormat.js';
import dayjs from 'dayjs';
import { constants } from '../_config/constants.js';

dotenv.config();

const router = express.Router();
const upload = multer();

router.post('/walletList', upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().optional(),
    user_uni_id: Joi.string().optional(),
    offset: Joi.number().integer().min(0).optional().default(0),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.number().integer().optional(),
    main_type: Joi.string().optional(),
    payment_method: Joi.string().optional(),
    from_date: Joi.string().optional(),
    to_date: Joi.string().optional(),
    search: Joi.string().optional(),
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

  const { 
    api_key, 
    user_uni_id, 
    offset = 0, 
    limit,
    status,
    main_type,
    payment_method,
    from_date,
    to_date,
    search
  } = req.body;

  try {
    // If api_key and user_uni_id provided, check authorization
    if (api_key && user_uni_id) {
      const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
      if (!isAuthorized) {
        return res.status(401).json({
          status: 0,
          error_code: 101,
          msg: 'Unauthorized User... Please login again',
        });
      }
    }

    const pageLimit = limit || constants.api_page_limit || 20;
    const whereClause = {};

    // Filter by user_uni_id if provided
    if (user_uni_id) {
      whereClause.user_uni_id = user_uni_id;
    }

    // Filter by status
    if (status !== undefined && status !== null && status !== '') {
      whereClause.status = parseInt(status);
    }

    // Filter by main_type (cr/dr)
    if (main_type && main_type.trim() !== '') {
      whereClause.main_type = main_type.trim();
    }

    // Filter by payment_method
    if (payment_method && payment_method.trim() !== '') {
      whereClause.payment_method = payment_method.trim();
    }

    // Date range filter
    if (from_date || to_date) {
      whereClause.created_at = {};
      if (from_date) {
        whereClause.created_at[Op.gte] = dayjs(from_date).startOf('day').toDate();
      }
      if (to_date) {
        whereClause.created_at[Op.lte] = dayjs(to_date).endOf('day').toDate();
      }
    }

    // Search filter
    if (search && search.trim() !== '') {
      whereClause[Op.or] = [
        { reference_id: { [Op.like]: `%${search.trim()}%` } },
        { transaction_code: { [Op.like]: `%${search.trim()}%` } },
        { gateway_order_id: { [Op.like]: `%${search.trim()}%` } },
        { gateway_payment_id: { [Op.like]: `%${search.trim()}%` } },
        { wallet_history_description: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    // Fetch wallet records
    const walletRecords = await WalletModel.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(pageLimit),
      raw: true,
    });

    // Format the records
    const formattedRecords = walletRecords.map((record) => {
      const amount = parseFloat(record.amount || 0);
      const transactionAmount = parseFloat(record.transaction_amount || 0);
      const exchangeRate = parseFloat(record.exchange_rate || 1);
      const finalAmount = (amount / exchangeRate).toFixed(2);
      const finalTransactionAmount = (transactionAmount / exchangeRate).toFixed(2);
      
      return {
        id: record.id,
        user_uni_id: record.user_uni_id || '',
        reference_id: record.reference_id || '',
        gateway_order_id: record.gateway_order_id || '',
        gateway_payment_id: record.gateway_payment_id || '',
        transaction_code: record.transaction_code || '',
        wallet_history_description: record.wallet_history_description || '',
        transaction_amount: finalTransactionAmount,
        amount: finalAmount,
        main_type: record.main_type || 'cr',
        created_by: record.created_by || '',
        admin_percentage: parseFloat(record.admin_percentage || 0),
        gst_amount: parseFloat(record.gst_amount || 0),
        astro_amount: parseFloat(record.astro_amount || 0),
        admin_amount: parseFloat(record.admin_amount || 0),
        tds_amount: parseFloat(record.tds_amount || 0),
        offer_amount: parseFloat(record.offer_amount || 0),
        gateway_charge: parseFloat(record.gateway_charge || 0),
        coupan_amount: parseFloat(record.coupan_amount || 0),
        currency: record.currency || 'INR',
        currency_code: record.currency_code || 'INR',
        currency_symbol: record.currency_symbol || '₹',
        exchange_rate: parseFloat(record.exchange_rate || 1),
        payment_method: record.payment_method || '',
        where_from: record.where_from || '',
        status: record.status || 0,
        gift_status: record.gift_status || null,
        offer_status: record.offer_status || 0,
        created_at: record.created_at ? formatDateTime(record.created_at) : '',
        updated_at: record.updated_at ? formatDateTime(record.updated_at) : '',
        raw_created_at: record.created_at || null,
        raw_updated_at: record.updated_at || null,
      };
    });

    return res.json({
      status: 1,
      data: formattedRecords,
      offset: parseInt(offset) + parseInt(pageLimit),
      msg: 'Wallet list',
    });
  } catch (err) {
    console.error('walletList Error:', err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;

