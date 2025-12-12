import express from 'express';
import multer from 'multer';
import Joi from 'joi';
import { Op, Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
dotenv.config();

import CallHistory from "../_models/call_history.js";
import CallHistoryImage from "../_models/call_history_images.js";
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';

const router = express.Router();

// Configure Multer to store uploaded files in a specific folder with a timestamped filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const dir = path.join('public', 'uploads/call_history_file/');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    try {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-file_url${ext}`;
      cb(null, filename);
    } catch (err) {
      cb(err);
    }
  }
});

// Set up Multer middleware with limits and file filtering for image types
// const upload = multer({
//   storage,
//   limits: { fileSize: 4 * 1024 * 1024 }, // 4MB max file size
//   fileFilter: (req, file, cb) => {
//     const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
//     if (allowed.includes(file.mimetype)) cb(null, true);
//     else cb(new Error('Only image files are allowed'));
//   }
// });
const upload = multer({ storage: storage });

// API endpoint to upload a file during a call
router.post('/sendFileOnCall', upload.single('file_url'), async (req, res) => {
  try {
    // Validate incoming request body
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      uniqeid: Joi.string().required(),
      call_type: Joi.string().optional().allow(null),
      file_type: Joi.string().optional().valid('Image', 'Other').default('Image'),
      file_url: Joi.any().required() // File input required
    });

    const body = req.body;
    const { error } = schema.validate({ ...body, file_url: req.file });
    if (error) {
      return res.status(400).json({
        status: 0,
        message: 'Something went wrong',
        errors: error.details,
        msg: error.details.map(err => err.message).join('\n')
      });
    }

    const { api_key, user_uni_id, uniqeid, file_type } = body;

    // Check if user is authorized
    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

    // Ensure a file was uploaded
    let fileUrl = '';
    if (req.file) {
      fileUrl = req.file.filename;
    } else {
      return res.status(400).json({
        status: 0,
        msg: 'File is required and must be an image format'
      });
    }

  
  const callHistoryRecord = await CallHistory.findOne({
      where: {
        uniqeid,
        status: {
          [Op.in]: ['queue', 'queue_request', 'request', 'in-progress']
        }
      }
    });

 
    if (!callHistoryRecord) {
      return res.status(200).json({
        status: 0,
        msg: 'Invalid uniqeid'
      });
    }



    // Create new call history image record
    const createPayload = {
      user_uni_id,
      uniqeid,
      call_type: body.call_type || 'call',
      file_type,
      file_url: fileUrl,
      status: 1
    };


    const newFile = await CallHistoryImage.create(createPayload);
    


    return res.status(200).json({
      status: 1,
      data: newFile,
      msg: 'create successfully'
    });
  } catch (err) {
    console.error('Error in /sendFileOnCall:', err.message);
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong. Please try again later.'
    });
  }
});

export default router;
