import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import db from "../_config/db.js";
import "../_models/index.js";
import WalletModel from '../_models/wallet.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import { Op } from 'sequelize';
import crypto from 'crypto';
import axios from 'axios';

dotenv.config();

const router = express.Router();
const upload = multer();

router.post('/updateOnlinePayment', upload.none(), async (req, res) => {
  try {
    const data = req.body;

    const requiredFields = ['api_key', 'user_uni_id', 'payment_method', 'payment_id', 'order_id'];
    for (let field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({
          status: 0,
          message: `Missing required field: ${field}`,
        });
      }
    }

    const { api_key, user_uni_id, payment_method, payment_id, order_id } = data;

    const validUser = await checkUserApiKey(api_key, user_uni_id);
    if (!validUser) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    let orderStatus = '';
    const gateway_payment_id = payment_id;
    const method = payment_method.toLowerCase();

    switch (method) {
      case 'razorpay':
        orderStatus = data.is_razorpay_webhook ? data.order_status || '' : 'Success';
        break;
      case 'ccavenue':
        orderStatus = data.order_status || '';
        break;
      case 'phonepe':
        orderStatus = (data.success == 1 || data.success === 'PAYMENT_SUCCESS') ? 'Success' :
                      (data.success === 'PAYMENT_ERROR' ? 'Failed' : '');
        break;
      case 'cashfree':
        orderStatus = data.order_status || ((data.success == 1 || data.success === true) ? 'Success' : '');
        break;
      case 'paypal':
        orderStatus = data.order_status === 'COMPLETED' ? 'Success' :
                      (data.order_status === 'DECLINED' ? 'Declined' : 'Failed');
        break;
      case 'payu':
        orderStatus = data.order_status === 'success' ? 'Success' : 'Failed';
        break;
      case 'paytm':
        orderStatus = 'Success';
        break;
    }

    let status = 0;
    if (orderStatus === 'Success') status = 1;
    else if (orderStatus === 'Failed') status = 2;
    else if (orderStatus === 'Declined') status = 3;

    const wallet = await WalletModel.findOne({ where: { gateway_order_id: order_id } });

    if (wallet && wallet.status !== 1) {
      await WalletModel.update({ status, gateway_payment_id }, { where: { gateway_order_id: order_id } });

      const updatedWallet = await WalletModel.findOne({ where: { gateway_order_id: order_id } });
    }

    return res.json({  message: 'Successfully', status: 1 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, message: 'Internal Server Error' });
  }
});

router.post('/razorpay-webhook', upload.none(), express.json(), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '123456'; // Use environment variable
    const signature = req.headers['x-razorpay-signature'];
    const requestBody = JSON.stringify(req.body);

    // Compute HMAC SHA256 hash
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(requestBody)
      .digest('hex');

    if (signature === expectedSignature) {
      const payload = req.body.payload || {};
      const event = req.body.event;
      
      const paymentEntity = payload.payment?.entity || {};
      const id = paymentEntity.id;
      const order_id = paymentEntity.order_id;

      const razorpay_response = {
        is_razorpay_webhook: 1,
        payment_method: 'razorpay',
        payment_id: id,
        order_id: order_id,
        order_status: ''
      };

      if (order_id) {
        if (event === 'payment.captured') {
          razorpay_response.order_status = 'Success';
        } else if (event === 'payment.failed') {
          razorpay_response.order_status = 'Failed';
        } else {
          razorpay_response.order_status = 'Failed';
        }
      } else {
        razorpay_response.order_status = 'Failed';
      }

      if (razorpay_response.order_status) {
        // Process the update directly rather than making another HTTP call
        const updateResult = await processPaymentUpdate(razorpay_response);
        
        if (updateResult.status === 1) {
          return res.status(200).json({ status: 'success' });
        }
      }

      return res.status(400).json({ status: 'failed', message: 'Invalid webhook data' });
    } else {
      return res.status(401).json({ status: 'failed', message: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});


export default router;
