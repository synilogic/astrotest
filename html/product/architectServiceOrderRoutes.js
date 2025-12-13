import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import { Op } from 'sequelize';
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';

const router = express.Router();
const upload = multer();

// Get architect service orders list for a customer
router.post('/architectServiceOrderList', upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().allow('').optional(),
    customer_uni_id: Joi.string().allow('').optional(),
    architect_uni_id: Joi.string().allow('').optional(), // Filter by architect
    offset: Joi.number().integer().min(0).optional().default(0),
    status: Joi.string().optional().allow(''), // Filter by status: pending, in-progress, completed, cancelled
    payment_status: Joi.string().optional().allow(''), // Filter by payment status: unpaid, paid
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((d) => d.message).join('\n'),
    });
  }

  const { api_key, user_uni_id, customer_uni_id, architect_uni_id, offset, status, payment_status } = value;

  // Get customer_uni_id from either field
  const customerUniId = customer_uni_id || user_uni_id;

  if (!customerUniId) {
    return res.json({
      status: 0,
      msg: 'customer_uni_id or user_uni_id is required',
    });
  }

  // Check authorization
  const isAuthorized = await checkUserApiKey(api_key, customerUniId);
  if (!isAuthorized) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  const page_limit = constants.api_page_limit_secondary || 10;

  try {
    // Import required models
    const { default: ArchitectServiceOrder } = await import('../_models/architectServiceOrder.js');
    const { default: User } = await import('../_models/users.js');
    const { default: Astrologer } = await import('../_models/astrologers.js');

    const whereCondition = {
      customer_uni_id: customerUniId,
    };

    // Filter by architect if provided
    if (architect_uni_id && architect_uni_id.trim() !== '') {
      whereCondition.architect_uni_id = architect_uni_id;
    }

    // Filter by status if provided
    if (status && status.trim() !== '') {
      whereCondition.status = status;
    }

    // Filter by payment status if provided
    if (payment_status && payment_status.trim() !== '') {
      whereCondition.payment_status = payment_status;
    }

    const architectServiceOrders = await ArchitectServiceOrder.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'architect_user',
          attributes: ['id', 'user_uni_id', 'name', 'email'],
          required: false,
        },
        {
          model: Astrologer,
          as: 'architect',
          attributes: ['id', 'astrologer_uni_id', 'display_name', 'astro_img'],
          required: false,
        },
      ],
      order: [['id', 'DESC']],
      offset: parseInt(offset),
      limit: page_limit,
    });

    if (!architectServiceOrders || architectServiceOrders.length === 0) {
      return res.json({ 
        status: 1, 
        data: [],
        offset: parseInt(offset) + page_limit,
        msg: 'No architect service orders found.' 
      });
    }

    // Format response data
    const formattedData = architectServiceOrders.map((order) => {
      const architect = order.architect || {};
      const architectUser = order.architect_user || {};
      
      return {
        id: order.id,
        customer_uni_id: order.customer_uni_id,
        architect_uni_id: order.architect_uni_id,
        architect_name: architect.display_name || architectUser.name || 'N/A',
        architect_img: architect.astro_img || null,
        order_type: order.order_type,
        where_from: order.where_from,
        uniqeid: order.uniqeid,
        order_date: order.order_date,
        order_start: order.order_start,
        order_end: order.order_end,
        duration: order.duration,
        charge: parseFloat(order.charge) || 0,
        max_order_duration: order.max_order_duration,
        is_review: order.is_review,
        status: order.status,
        payment_status: order.payment_status,
        refund_valid_date: order.refund_valid_date,
        offer_type: order.offer_type,
        customer_offline_at: order.customer_offline_at,
        created_at: order.created_at,
        updated_at: order.updated_at,
      };
    });

    return res.json({
      status: 1,
      data: formattedData,
      offset: parseInt(offset) + page_limit,
      msg: 'Architect service orders retrieved successfully',
    });
  } catch (err) {
    console.error('Error fetching architect service orders:', err);
    return res.json({
      status: 0,
      msg: 'Something went wrong',
      error: err.message,
    });
  }
});

export default router;

