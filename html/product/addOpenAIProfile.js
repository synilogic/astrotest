
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from 'joi';
import db from '../_config/db.js';
import '../_models/index.js';
import OpenAIProfile from '../_models/open_ai_profiles.js';
import CustomerModel from '../_models/customers.js';
import User from '../_models/users.js';
import Offer from '../_models/offers.js';   
import OpenAIPrediction from '../_models/open_ai_predictions.js';
import {addOpenAIProfile,getOpenAIProfile,tobFormatForApp,dobFormatForApp,openAIPredictionList,checkOpenAIProfile,
  updateOpenAIProfile
} from '../_helpers/openaicommon.js';
import { checkUserApiKey ,getTotalBalanceById,getCustomerById} from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import { constants, imagePath } from "../_config/constants.js";

import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { formatDateTime } from "../_helpers/dateTimeFormat.js";
const router = express.Router();
const upload = multer();


router.post("/openAIPredictionList", upload.none(),async (req, res) => {
  // Validate input
   
 
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    page: Joi.number().optional().allow(null),
  });

   const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error || !value) {
        return res.json({
            status: 0,
            msg: 'Invalid input',
            errors: error?.details || [],
            message: error?.details?.map(e => e.message).join('\n') || 'Invalid data'
        });
     }


  const { api_key, user_uni_id, page = 0 } = value;

  try {
    // Check API key validity
    const isValid = await checkUserApiKey(api_key, user_uni_id);
    console.log("hjjh",isValid);
    if (!isValid) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }
       
    // Fetch prediction list and profile
    const data = await openAIPredictionList(req.body);
    
    const openAIProfile = await checkOpenAIProfile(user_uni_id);
       
    // Format DOB/TOB
    if (openAIProfile?.dob) {
      openAIProfile.dob = dobFormatForApp(openAIProfile.dob);
    }
    if (openAIProfile?.tob) {
      openAIProfile.tob = tobFormatForApp(openAIProfile.tob);
    }

    // Build response
    if (data && data.length > 0) {
      return res.json({
        status: 1,
        page: page + 1,
        openAIProfile,
        data,
        msg: "Get successfully",
      });
    } else {
      return res.json({
        status: 0,
        msg: "No data found",
      });
    }
  } catch (err) {
    console.error("Error in /openAIPredictionList:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
    });
  }
});


router.post("/addOpenAIProfile",upload.none(), async (req, res) => {
 
 // Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    name: Joi.string().required(),
    gender: Joi.string().required(),
    dob: Joi.string().required(),
    tob: Joi.string().required(),
    pob: Joi.string().required(),
    lat: Joi.number().required(),
    lon: Joi.number().required(),
    lang: Joi.string().optional().allow(null, ''),
    is_selected: Joi.number().optional().allow(null),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error || !value) {
        return res.json({
            status: 0,
            msg: 'Invalid input',
            errors: error?.details || [],
            message: error?.details?.map(e => e.message).join('\n') || 'Invalid data'
        });
     }


  const {
    api_key,
    user_uni_id,
    name,
    gender,
    dob,
    tob,
    pob,
    lat,
    lon,
    lang,
    is_selected,
  } = value;
   
  try {
    
    // Check API Key validity
    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }
         
    // Call business logic function (mimics Laravel's Api::addOpenAIProfile)
    const result = await addOpenAIProfile(req.body); // Implement logic separately
     
    if (result) {

       // Format created_at and updated_at only here
      const formatted = typeof result?.toJSON === 'function' ? result.toJSON() : { ...result };

      if (formatted.created_at) {
        formatted.created_at = dayjs(formatted.created_at).format('YYYY-MM-DD HH:mm:ss');
      }
      if (formatted.updated_at) {
        formatted.updated_at = dayjs(formatted.updated_at).format('YYYY-MM-DD HH:mm:ss');
      }
      return res.json({
        status: 1,
        data: formatted,
        msg: "Get successfully",
      });
    } else {
      return res.json({
        status: 0,
        data: '',
        msg: "No data found",
      });
    }
  } catch (err) {
    console.error("Error in /addOpenAIProfile:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
    });
  }
});

router.post('/getOpenAIProfile',upload.none(), async (req, res) => {
  // Optional: Log API call
 // await saveApiLogs(req.body);

  // Validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    open_ai_profile_id: Joi.string().optional().allow(null, ''),
  });

   const { error, value } = schema.validate(req.body);

        if (error || !value) {
        return res.json({
            status: 0,
            msg: 'Invalid input',
            errors: error?.details || [],
            message: error?.details?.map(e => e.message).join('\n') || 'Invalid data'
        });
        }


  const { api_key, user_uni_id, open_ai_profile_id } = value;

  // API Key Check
  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    
    const result = await getOpenAIProfile(req.body);
    if (result) {
      
        // Use .toJSON() if it's a Sequelize model, otherwise use directly
      const formatted = typeof result?.toJSON === 'function' ? result.toJSON() : { ...result };

      // Format created_at and updated_at if present
      if (formatted.created_at) {
        formatted.created_at = dayjs(formatted.created_at).format('YYYY-MM-DD HH:mm:ss');
      }
      if (formatted.updated_at) {
        formatted.updated_at = dayjs(formatted.updated_at).format('YYYY-MM-DD HH:mm:ss');
      }


      if (formatted.dob) {
        formatted.dob = dobFormatForApp(formatted.dob);
      }

      if (formatted.tob) {
        formatted.tob = tobFormatForApp(formatted.tob);
      }

      return res.json({
        status: 1,
        data: formatted,
        msg: 'Get successfully',
      });
    } else {
      return res.json({
        status: 0,
        data: '',
        msg: 'No data found',
      });
    }
  } catch (err) {
    console.error('Error fetching OpenAI Profile:', err);
    return res.status(500).json({
      status: 0,
      data: '',
      msg: 'Internal Server Error',
    });
  }
});


router.post("/updateOpenAIProfile",upload.none(), async (req, res) => {
  // Log incoming request
 // saveapiLogs(req.body);

  // Validate request
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    name: Joi.string().required(),
    gender: Joi.string().required(),
    dob: Joi.string().required(),
    tob: Joi.string().required(),
    pob: Joi.string().required(),
    lat: Joi.string().required(),
    lon: Joi.string().required(),
    lang: Joi.string().optional().allow(null, ''),
    open_ai_profile_id: Joi.any().optional().allow(null),
    is_selected: Joi.any().optional().allow(null),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n')
    });
  }

  const {
    api_key,
    user_uni_id
  } = value;

  try {
    // Check API key validity
    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

    // Update OpenAI Profile
    const result = await updateOpenAIProfile({value});

 



      if (result) {

       // Format created_at and updated_at only here
      const formatted = typeof result?.toJSON === 'function' ? result.toJSON() : { ...result };

      if (formatted.created_at) {
        formatted.created_at = dayjs(formatted.created_at).format('YYYY-MM-DD HH:mm:ss');
      }
      if (formatted.updated_at) {
        formatted.updated_at = dayjs(formatted.updated_at).format('YYYY-MM-DD HH:mm:ss');
      }

        if (formatted.dob) {
        formatted.dob = dobFormatForApp(formatted.dob);
      }

      if (formatted.tob) {
        formatted.tob = tobFormatForApp(formatted.tob);
      }

      return res.json({
        status: 1,
        data: formatted,
        msg: "Get successfully",
      });
   
    } else {
      return res.json({
        status: 0,
        data: '',
        msg: 'No data found'
      });
    }
  } catch (err) {
    console.error("Error in updateOpenAIProfile:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error"
    });
  }
});


export default router