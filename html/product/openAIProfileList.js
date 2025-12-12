import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from 'joi';
import db from '../_config/db.js';
import '../_models/index.js';
import OpenAIProfile from '../_models/open_ai_profiles.js';
import CustomerModel from '../_models/customers.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import { constants, imagePath } from "../_config/constants.js";
import {formatTime,dobFormatForApp,tobFormatForApp} from "../_helpers/openaicommon.js";
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { formatDateTime } from "../_helpers/dateTimeFormat.js";

dotenv.config();

const router = express.Router();
const upload = multer();


router.post("/openAIProfileList", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().optional().default(0)
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      message: 'Validation failed',
      errors: error.details,
      msg: error.details.map(err => err.message).join('\n')
    });
  }

  const { api_key, user_uni_id, offset } = value;

  try {
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const pageLimit = constants.api_page_limit || 6;

    // Fetch OpenAI profiles
    const openAIProfiles = await OpenAIProfile.findAll({
      where: { customer_uni_id: user_uni_id },
      order: [['id', 'DESC']],
      offset,
      limit: pageLimit
    });

   const hostUrl = `${req.protocol}://${req.get("host")}/`;
   
    const customerImgPath = `${hostUrl}${imagePath.customer_image_path}`;
    const botImg = `${hostUrl}${imagePath.default_bot_image_path}`;
    const defaultCustomerImg = `${hostUrl}${imagePath.default_customer_image_path}`;

    let customerImage = botImg;

    // If any profile has is_self_profile = 1, fetch customer image
    if (openAIProfiles.some(p => p.is_self_profile === 1)) {
      const customer = await CustomerModel.findOne({
        where: { customer_uni_id: user_uni_id },
        attributes: ['customer_img']
      });
      if (customer && customer.customer_img) {
        const imgFilePath = `${customerImgPath}${customer.customer_img}`;
        if (fs.existsSync(imgFilePath)) {
          customerImage = `${customerImgPath}${customer.customer_img}`;
        } else {
          customerImage = defaultCustomerImg;
        }
      }
    }

   const data = openAIProfiles.map(profile => {
   const json = profile.toJSON();

  return {
    ...json,
    dob: dobFormatForApp(json.dob),
    tob: tobFormatForApp(json.tob),
    profile_image: customerImage,
    created_at: dayjs(json.created_at).format("YYYY-MM-DD HH:mm:ss"),
    updated_at: json.updated_at
      ? dayjs(json.updated_at).format("YYYY-MM-DD HH:mm:ss")
      : null,
   // days_since_created: dayjs().diff(dayjs(json.created_at), 'day') + ' days ago',
  };
});

  

    if (data.length) {
      return res.status(200).json({
        status: 1,
        offset: offset + pageLimit,
        data,
        msg: 'Get successfully'
      });
    } else {
      return res.status(200).json({
        status: 0,
        msg: 'No data found'
      });
    }

  } catch (err) {
    console.error("openAIProfileList error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});



export default router;
