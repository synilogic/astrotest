import express from 'express';
import multer from 'multer';  
import dotenv from 'dotenv';
import Joi from 'joi';
import db from '../_config/db.js';
import '../_models/index.js';
import OpenAIProfile from '../_models/open_ai_profiles.js';
import User from '../_models/users.js';
import Customer from '../_models/customers.js';
import CCAvenueGateway from '../_helpers/services/CCAvenueGateway.js';
import PhonePeGateway from '../_helpers/services/PhonePeGateway.js';
import CashfreeGateway from '../_helpers/services/CashfreeGateway.js';
import PayUGateway from '../_helpers/services/PayUGateway.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import { constants, imagePath } from "../_config/constants.js";
import {openAIPredictionCalculation,openAIPredictionPurchase,dobFormatForApp,
tobFormatForApp,selectOpenAIProfile,deleteOpenAIProfile,openAIPredictionPurchaseNew} from "../_helpers/openaicommon.js";
import { Op,Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { formatDateTime } from "../_helpers/dateTimeFormat.js";

const upload = multer();
const router = express.Router();

router.post("/openAIPredictionCalculation", upload.none(), async (req, res) => {
  try {
    // Log API input
    //saveApiLogs(req.body);
  
    // Validate input
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      offer_code: Joi.string().allow(null, ''),
      wallet_check: Joi.any().optional()
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

        // ✅ Safe to destructure now
        const { api_key, user_uni_id } = value;
    // Check API key
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

    // Inject wallet_check = 1
    const requestData = {
      ...value,
      wallet_check: 1
    };
          
    // Call open AI prediction logic
    const result = await openAIPredictionCalculation(requestData);

    return res.json(result);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      error: err.message
    });
  }
});


router.post("/openAIPredictionPurchase", upload.none(), async (req, res) => {
  try {
    // Joi Validation

  console.log("req.body",req.body);
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      question: Joi.string().required(),
      offer_code: Joi.string().allow(null, '').optional(),
     payment_method: Joi.string().allow(null, '').optional(),
     wallet_check: Joi.any().optional(),
     is_updated: Joi.any().optional(),
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

    const { api_key, user_uni_id, payment_method } = value;

    // API Key Check
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }

    // Get customer data
  const customerData = await Customer.findOne({
  where: { customer_uni_id: user_uni_id },
  include: [{
    model: User,
    as: "user", // Must match alias
    required: true
  }]
});


    const requestData = {
      ...value,
      wallet_check: 1,
    };

   let result = await openAIPredictionPurchase(requestData); // core logic like Laravel Api::openAIPredictionPurchase

    if (result) {
      result.customerData = customerData;

      // If payment gateway is needed
      if (result.status === 1 && result.payment_gateway_status === 1) {
        if (payment_method === "razorpay") {
          // No changes, handled on client
        } else if (payment_method === "CCAvenue") {
          const ccavenue = new CCAvenueGateway();
          const ccavenueReq = await ccavenue.request(result.payment_gateway);
          const enc_val = ccavenueReq?.encRequest || "";

          if (enc_val) {
            result.ccavenue_data = {
            order_id: result.order_id,
            access_code: await getConfig('ccavenue_access_code'),
            redirect_url: `${req.protocol}://${req.get('host')}/api/paymentresponseccavenueapp`,
            cancel_url: `${req.protocol}://${req.get('host')}/api/paymentresponseccavenueapp`,
            enc_val: enc_val,
            merchant_id: await getConfig('ccavenue_merchant_id'),
            working_key: await getConfig('ccavenue_working_key'),
            currency: await getConfig('ccavenue_currency'),
            language: await getConfig('ccavenue_language'),
            };
          } else {
            result.status = 0;
            result.msg = "Something went Wrong on payment gateway. Please Try Again";
          }
        } else if (payment_method === "PhonePe") {
          const phonepe = new PhonePeGateway();
          const phonepeData = await phonepe.requestApp(result.payment_gateway);
          if (phonepeData.status === 1) {
            phonepeData.order_id = result.order_id;
            result.phonepe_data = phonepeData;
          } else {
            result.status = 0;
            result.msg = "Something went Wrong on payment gateway. Please Try Again";
          }
        } else if (payment_method === "Cashfree") {
          const cashfree = new CashfreeGateway();
          const cashfreeData = await cashfree.request(result.payment_gateway);
          if (cashfreeData.status === 1) {
            result.cashfree_data = cashfreeData;
          } else {
            result.status = 0;
            result.msg = "Something went Wrong on payment gateway. Please Try Again";
          }
        } else if (payment_method === "Payu") {
          const payu = new PayUGateway();
          const payuData = await payu.generatePaymentLink(result.payment_gateway);
          if (payuData.status === 1) {
            result.payu_data = payuData;
          } else {
            result.status = 0;
            result.msg = "Something went Wrong on payment gateway. Please Try Again";
          }
        }
      }
    }

    return res.json(result);
  } catch (err) {
    console.error("Error in /openAIPredictionPurchase:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      error: err.message,
    });
  }
});
  
router.post("/openAIPredictionPurchaseNew", upload.none(), async (req, res) => {
  try {
    // Joi Validation

  console.log("req.body",req.body);
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      question: Joi.string().required(),
      offer_code: Joi.string().allow(null, ''),
      wallet_check: Joi.any().optional(),
      payment_method: Joi.string().allow(null, ''),
      is_updated: Joi.any().optional(),
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

    const { api_key, user_uni_id, payment_method } = value;

    // API Key Check
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }

    // Get customer data
  const customerData = await Customer.findOne({
  where: { customer_uni_id: user_uni_id },
  include: [{
    model: User,
    as: "user", // Must match alias
    required: true
  }]
});


    const requestData = {
      ...value,
      wallet_check: 1,
    };

   let result = await openAIPredictionPurchaseNew(requestData); // core logic like Laravel Api::openAIPredictionPurchase
        console.log(result,"result");
    if (result) {
      result.customerData = customerData;

      // If payment gateway is needed
      if (result.status === 1 && result.payment_gateway_status === 1) {
        if (payment_method === "razorpay") {
          // No changes, handled on client
        } else if (payment_method === "CCAvenue") {
          const ccavenue = new CCAvenueGateway();
          const ccavenueReq = await ccavenue.request(result.payment_gateway);
          const enc_val = ccavenueReq?.encRequest || "";

          if (enc_val) {
            result.ccavenue_data = {
            order_id: result.order_id,
            access_code: await getConfig('ccavenue_access_code'),
            redirect_url: `${req.protocol}://${req.get('host')}/api/paymentresponseccavenueapp`,
            cancel_url: `${req.protocol}://${req.get('host')}/api/paymentresponseccavenueapp`,
            enc_val: enc_val,
            merchant_id: await getConfig('ccavenue_merchant_id'),
            working_key: await getConfig('ccavenue_working_key'),
            currency: await getConfig('ccavenue_currency'),
            language: await getConfig('ccavenue_language'),
            };
          } else {
            result.status = 0;
            result.msg = "Something went Wrong on payment gateway. Please Try Again";
          }
        } else if (payment_method === "PhonePe") {
          const phonepe = new PhonePeGateway();
          const phonepeData = await phonepe.requestApp(result.payment_gateway);
          if (phonepeData.status === 1) {
            phonepeData.order_id = result.order_id;
            result.phonepe_data = phonepeData;
          } else {
            result.status = 0;
            result.msg = "Something went Wrong on payment gateway. Please Try Again";
          }
        } else if (payment_method === "Cashfree") {
          const cashfree = new CashfreeGateway();
          const cashfreeData = await cashfree.request(result.payment_gateway);
          if (cashfreeData.status === 1) {
            result.cashfree_data = cashfreeData;
          } else {
            result.status = 0;
            result.msg = "Something went Wrong on payment gateway. Please Try Again";
          }
        } else if (payment_method === "Payu") {
          const payu = new PayUGateway();
          const payuData = await payu.generatePaymentLink(result.payment_gateway);
          if (payuData.status === 1) {
            result.payu_data = payuData;
          } else {
            result.status = 0;
            result.msg = "Something went Wrong on payment gateway. Please Try Again";
          }
        }
      }
    }

    return res.json(result);
  } catch (err) {
    console.error("Error in /openAIPredictionPurchase:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      error: err.message,
    });
  }
});

router.post("/selectOpenAIProfile", upload.none(), async (req, res) => {
  try {
    // Log API input
    //saveApiLogs(req.body);
  
    // Validate input
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      open_ai_profile_id: Joi.string().allow(null, ''),
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

        // ✅ Safe to destructure now
            const { api_key, user_uni_id, open_ai_profile_id } = value;
    // Check API key
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

   
    
          
    // Call open AI prediction logic
    const profile = await selectOpenAIProfile({ user_uni_id, open_ai_profile_id });
       console.log("profile",profile);
    // 5. Format and respond
      if (profile) {
        if (profile.dob) profile.dob = dobFormatForApp(profile.dob);
        if (profile.tob) profile.tob = tobFormatForApp(profile.tob);
               const result = { ...profile};

      if (result.dob) {
        result.dob = dobFormatForApp(result.dob);
      }
      if (result.tob) {
        result.tob = tobFormatForApp(result.tob);
      }

      // format created_at & updated_at as "YYYY-MM-DD HH:mm:ss"
      result.created_at = dayjs(result.created_at).format('YYYY-MM-DD HH:mm:ss');
      result.updated_at = dayjs(result.updated_at).format('YYYY-MM-DD HH:mm:ss');
        return res.json({
          status: 1,
          data: result,
          msg: 'Selected successfully',
        });
      } else {
        return res.json({
          status: 0,
          data: '',
          msg: 'No data found',
        });
      }

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      error: err.message
    });
  }
});

router.post("/deleteOpenAIProfile", upload.none(), async (req, res) => {
  try {
    // Log API input
    //saveApiLogs(req.body);
  
    // Validate input
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      open_ai_profile_id: Joi.string().allow(null, ''),
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

        // ✅ Safe to destructure now
            const { api_key, user_uni_id, open_ai_profile_id } = value;
    // Check API key
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

   
    
          
    // Call open AI prediction logic
    const profile = await deleteOpenAIProfile({ user_uni_id, open_ai_profile_id });

       return res.json({
          status: 1,
          data: profile,
          msg: 'Deleted successfully',
     });
   

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      error: err.message
    });
  }
});


export default router;

 






    
  

