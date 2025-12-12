import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import User from '../_models/users.js';
import { checkUserApiKey } from '../_helpers/common.js';

dotenv.config();

const router = express.Router();
const upload = multer();

router.post("/updateFcmToken", upload.none(), async (req, res) => {
  // Step 1: Validate Input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    fcm_token: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      status: 0,
      message: 'Validation failed',
      errors: error.details,
      msg: error.details.map(err => err.message).join('\n')
    });
  }

  const { api_key, user_uni_id, fcm_token } = value;

  try {
    // Step 2: Check API Key Validity
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    // Step 3: Find the user
    const userDetails = await User.findOne({
      where: {
        user_uni_id,
        status: 1,
        trash: 0,
      },
    });

    // Step 4: Update or Return Not Found
    if (userDetails) {
      await userDetails.update({ user_fcm_token: fcm_token });

      return res.json({
        status: 1,
        data: userDetails,
        msg: 'Updated Successfully',
      });
    } else {
      return res.json({
        status: 0,
        data: [],
        msg: 'No Data Found',
      });
    }
  } catch (err) {
    console.error("updateFcmToken error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

export default router;
