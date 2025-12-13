import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import { Op } from 'sequelize';
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';

const router = express.Router();
const upload = multer();

// Get slot bookings list (appointment orders) for a customer
router.post('/slotBookingList', upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().allow('').optional(),
    customer_uni_id: Joi.string().allow('').optional(),
    offset: Joi.number().integer().min(0).optional().default(0),
    status: Joi.string().optional().allow(''), // Filter by status: pending, in-progress, completed, cancel
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

  const { api_key, user_uni_id, customer_uni_id, offset, status } = value;

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
    const { default: SlotBooking } = await import('../_models/slot_bookings.js');
    const { default: User } = await import('../_models/users.js');
    const { default: Astrologer } = await import('../_models/astrologers.js');

    const whereCondition = {
      customer_uni_id: customerUniId,
    };

    // Filter by status if provided
    if (status && status.trim() !== '') {
      whereCondition.status = status;
    }

    const slotBookings = await SlotBooking.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'astrologer_user',
          attributes: ['id', 'user_uni_id', 'name', 'email'],
          required: false,
        },
        {
          model: Astrologer,
          as: 'astrologer',
          attributes: ['id', 'astrologer_uni_id', 'display_name', 'astro_img'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
      offset: parseInt(offset),
      limit: page_limit,
    });

    if (!slotBookings || slotBookings.length === 0) {
      return res.json({ 
        status: 1, 
        data: [],
        offset: parseInt(offset) + page_limit,
        msg: 'No appointment bookings found.' 
      });
    }

    // Format response data
    const formattedData = slotBookings.map((booking) => {
      const astrologer = booking.astrologer || {};
      const astrologerUser = booking.astrologer_user || {};
      
      return {
        id: booking.id,
        order_id: booking.order_id,
        astrologer_uni_id: booking.astrologer_uni_id,
        astrologer_name: astrologer.display_name || astrologerUser.name || 'N/A',
        astrologer_img: astrologer.astro_img || null,
        slot_date: booking.slot_date,
        slot_start: booking.slot_start,
        slot_end: booking.slot_end,
        slot_duration: booking.slot_duration,
        charge: parseFloat(booking.charge) || 0,
        serial_no: booking.serial_no,
        status: booking.status,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      };
    });

    return res.json({
      status: 1,
      data: formattedData,
      offset: parseInt(offset) + page_limit,
      msg: 'Appointment bookings retrieved successfully',
    });
  } catch (err) {
    console.error('Error fetching slot bookings:', err);
    return res.json({
      status: 0,
      msg: 'Something went wrong',
      error: err.message,
    });
  }
});

export default router;

