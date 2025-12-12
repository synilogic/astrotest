
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import db from "../_config/db.js";
import "../_models/index.js";
import UserModel from '../_models/users.js';
import ApiKeyModel from '../_models/apikeys.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import { Op } from 'sequelize';

dotenv.config();

const router = express.Router();
const upload = multer();


router.post("/deleteAccount", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
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

  const { api_key, user_uni_id } = req.body;

  try {
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

     const user = await UserModel.findOne({ where: { user_uni_id, status: 1, trash: 0}});

  let result;

  if (user) {
    await user.update({ status: 0, trash: 1 });
    await ApiKeyModel.destroy({ where: { user_uni_id } });

    result = {
      status: 1,
      msg: 'Your account is deleted successfully'
    };
  } else {
    result = {
      status: 0,
      msg: 'No Record Found'
    };
  }

  return res.status(200).json(result);
   

  } catch (err) {
    console.error("deleteAccount error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

export default router;
