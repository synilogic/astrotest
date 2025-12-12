import express from "express";
import multer from 'multer';
import dotenv from 'dotenv';
import bcryptjs from "bcryptjs";
import Joi from "joi";
import db from "../_config/db.js";

import { Op } from "sequelize";
import {checkUserApiKey} from "../_helpers/common.js";
import User from "../_models/users.js";
import Customer from "../_models/customers.js";
import Follower from "../_models/followers.js";

dotenv.config();
const router = express.Router();
const upload = multer();
// Joi Validation schema



router.post('/astrologerFollow', upload.none(), async (req, res) => {

  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    status: Joi.number().valid(0, 1).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      message: 'Validation failed',
      errors: error.details,
      msg: error.details.map(err => err.message).join('\n')
    });
  }

 const { api_key, astrologer_uni_id, user_uni_id, status} = req.body;

  try {

 
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const existingFollower = await Follower.findOne({
  where: {
astrologer_uni_id,
    user_uni_id,
  }
});

if (existingFollower) {
  if (existingFollower.status === parseInt(status)) {
    // Same status already exists
    return res.status(200).json({
      status: 0,
      msg: `Already ${status == 1 ? 'Follow' : 'Unfollow'}`,
    });
  }

  // Status changed
  await existingFollower.update({ status });
  return res.status(200).json({
    status: 1,
    msg: `Successfully ${status == 1 ? 'Follow' : 'Unfollow'}`,
  });
} else {
  // No record yet, so create
  await Follower.create({
    astrologer_uni_id,
    user_uni_id,
    status,
  });
  return res.status(200).json({
    status: 1,
    msg: `Successfully ${status == 1 ? 'Follow' : 'Unfollow'}`,
  });
}



  } catch (err) {
    console.error("Error in astrologerFollow:", err);
    const result = {
      status: 0,
      msg: "Something went wrong.. Try Again",
    };

    return res.status(500).json(result);
  }
});
export default router;