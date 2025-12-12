import express from 'express';
import Joi from 'joi';
import { Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

import CallHistory from '../_models/call_history.js';
import CallHistoryImage from '../_models/call_history_images.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from "../_config/constants.js";

import { formatDateTime } from "../_helpers/dateTimeFormat.js";

const router = express.Router();
import multer from "multer";
const upload = multer();

// GET File on Call API
router.post('/getFileOnCall', upload.none(), async (req, res) => {
  try {
    // Validate input fields
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      uniqeid: Joi.string().required(),
      call_type: Joi.string().optional().allow(null, ''),
      file_type: Joi.string().optional().allow(null, ''),
      send_by: Joi.string().valid('Astrologer', 'Customer').optional().allow(null, '')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 0,
        errors: error.details,
        message: 'Something went wrong',
        msg: error.details.map(err => err.message).join('\n')
      });
    }

    const { api_key, user_uni_id, uniqeid, call_type, file_type, send_by } = value;

    // Check API key validity
    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

    // Check if call history exists
    const callHistory = await CallHistory.findOne({ where: { uniqeid } });
    if (!callHistory) {
      return res.status(200).json({
        status: 0,
        msg: 'Invalid uniqeid'
      });
    }

    // Build query to fetch matching images
    const whereClause = { uniqeid };

    if (file_type) {
      whereClause.file_type = file_type;
    }

    if (call_type) {
      whereClause.call_type = call_type;
    }

    if (send_by === 'Astrologer') {
      whereClause.user_uni_id = { [Op.like]: 'ASTRO%' };
    } else if (send_by === 'Customer') {
      whereClause.user_uni_id = { [Op.like]: 'CUS%' };
    }

    const images = await CallHistoryImage.findAll({ where: whereClause });

    if (images && images.length > 0) {

 const hostUrl = `${req.protocol}://${req.get("host")}/${constants.call_history_file_path}`;
    const formattedData = images.map(img => ({
      id: img.id,
      user_uni_id: img.user_uni_id,
      uniqeid: img.uniqeid,
      call_type: img.call_type,
      file_url: hostUrl + img.file_url,
      file_type: img.file_type,
      status: img.status,
      created_at: formatDateTime(img.created_at),
      updated_at: formatDateTime(img.updated_at)
    }));

    return res.status(200).json({
      status: 1,
      data: formattedData,
      msg: 'Get successfully'
    });
    } else {
      return res.status(200).json({
        status: 0,
        msg: 'No matching records found'
      });
    }
  } catch (err) {
    console.error('Error in /getFileOnCall:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong. Please try again later.'
    });
  }
});

export default router;
