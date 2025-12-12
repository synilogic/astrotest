// astrologers/callHistory.js
import express from "express";
import Joi from "joi";
import { checkUserApiKey } from "../_helpers/common.js";
import { astroCallHistory } from "../_helpers/callHistoryService.js";
import { getConfig } from "../configStore.js";
import multer from 'multer';
const upload = multer();

const router = express.Router();

router.post("/astroCallHistory", upload.none(), async (req, res) => {
  // Validation schema
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    call_type: Joi.string().allow('', null).optional(),
    offset: Joi.number().integer().min(0).optional().default(0),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n'),
    });
  }

  const { api_key, user_uni_id } = attributes;

  // Check authorization
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    const limit = 15; // You can get this from config
    const offset = attributes.offset || 0;

    // Prepare request object for service
    const requestData = {
      ...attributes,
      limit: limit,
      offset: offset
    };


    const records = await astroCallHistory(requestData);

    if (records && records.length > 0) {
      const result = {
        status: 1,
        msg: "Successfully...",
        offset: offset + limit,
        data: records,
      };
      return res.json(result);
    } else {
      const result = {
        status: 0,
        msg: "Data Not Found...",
      };
      return res.json(result);
    }
  } catch (err) {
    console.error("Error fetching call history:", err);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong",
      error: err.message,
    });
  }
});

export default router;