// Fixed and cleaned version of your /productCalculation route

import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import dotenv from 'dotenv';
import { Op, Sequelize } from 'sequelize';
import { checkUserApiKey } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import db from '../_config/db.js';
import UserModel from '../_models/users.js';
import ProductModel from '../_models/product.js';
import WalletModel from '../_models/wallet.js';
import OfferModel from '../_models/offers.js';
import dayjs from 'dayjs';
import { calculateProductDetails } from '../_helpers/services/productCalculationService.js';

dotenv.config();
const router = express.Router();
const upload = multer();


router.post('/productCalculation', upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    item: Joi.any().required(),
    vendor_uni_id: Joi.string().required(),
    product_id: Joi.string().required(),
    reference_id: Joi.string().optional().allow('', null),
    offer_code: Joi.string().optional().allow('', null),
    wallet_check: Joi.any().optional().allow('', null),
    payment_method: Joi.any().optional().allow('', null),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: 0, msg: error.details.map(e => e.message).join('\n') });
  }

  const { api_key, user_uni_id, vendor_uni_id, product_id, reference_id, offer_code, item, wallet_check } = value;

  try {
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) return res.status(401).json({ status: 0, msg: 'Unauthorized User... Please login again' });

    // Use the service for calculation
    const result = await calculateProductDetails({
      user_uni_id,
      vendor_uni_id,
      product_id,
      item,
      reference_id,
      offer_code,
      wallet_check
    });

    // Return the result as the API response
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in productCalculation:', err);
    return res.status(500).json({ status: 0, msg: 'Something went wrong' });
  }
});

export default router;
