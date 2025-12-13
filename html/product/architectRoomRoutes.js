import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import { Op } from 'sequelize';
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';

const router = express.Router();
const upload = multer();

// Get architect rooms list for a customer
router.post('/architectRoomList', upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().allow('').optional(),
    customer_uni_id: Joi.string().allow('').optional(),
    architect_uni_id: Joi.string().allow('').optional(), // Filter by architect
    offset: Joi.number().integer().min(0).optional().default(0),
    status: Joi.number().integer().optional(), // Filter by status: 0=inactive, 1=active
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

  const { api_key, user_uni_id, customer_uni_id, architect_uni_id, offset, status } = value;

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
    const { default: ArchitectRoom } = await import('../_models/architectRoom.js');
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
    if (typeof status === 'number') {
      whereCondition.status = status;
    }

    const architectRooms = await ArchitectRoom.findAll({
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
      order: [['created_at', 'DESC']],
      offset: parseInt(offset),
      limit: page_limit,
    });

    if (!architectRooms || architectRooms.length === 0) {
      return res.json({ 
        status: 1, 
        data: [],
        offset: parseInt(offset) + page_limit,
        msg: 'No architect rooms found.' 
      });
    }

    // Get base URL for images
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Format response data
    const formattedData = architectRooms.map((room) => {
      const architect = room.architect || {};
      const architectUser = room.architect_user || {};
      
      return {
        id: room.id,
        customer_uni_id: room.customer_uni_id,
        architect_uni_id: room.architect_uni_id,
        architect_name: architect.display_name || architectUser.name || 'N/A',
        architect_img: architect.astro_img || null,
        room_name: room.room_name,
        room_type: room.room_type,
        room_description: room.room_description,
        room_image: room.room_image ? `${baseUrl}${room.room_image}` : null,
        dimensions: room.dimensions,
        floor_number: room.floor_number,
        price: parseFloat(room.price) || 0,
        status: room.status,
        status_label: room.status === 1 ? 'Active' : 'Inactive',
        created_at: room.created_at,
        updated_at: room.updated_at,
      };
    });

    return res.json({
      status: 1,
      data: formattedData,
      offset: parseInt(offset) + page_limit,
      msg: 'Architect rooms retrieved successfully',
    });
  } catch (err) {
    console.error('Error fetching architect rooms:', err);
    return res.json({
      status: 0,
      msg: 'Something went wrong',
      error: err.message,
    });
  }
});

export default router;

