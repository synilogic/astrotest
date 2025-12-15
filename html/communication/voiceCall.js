import express from "express";
import dotenv from "dotenv";
const router = express.Router();
dotenv.config();
import path from "path";
import fs from "fs";
import authenticateToken from "../_middlewares/auth.js";
import { Op, Sequelize } from "sequelize";
import Joi from "joi";
import { constants } from "../_config/constants.js";
import moment from "moment-timezone";
import CallHistory from "../_models/callHistoryModel.js";
import {
  startCall,
  checkUserApiKey,
  callTransations,
  removeBusyStatus,
  getByToken,
  waitingCustomer,
  checkCallDetail,
  getCustomerQueueList,
  getVoiceCallRequest,
  getCustomerById,
  sendNotification,
   saveIntake,
   getIntakes,
   checkFirebaseCustomAuthToken,
  generateAgoraRtcToken,
  getAstrologerQueueList
} from "../_helpers/common.js";
import multer from "multer";
import Astrologer from "../_models/astrologers.js";
import User from "../_models/users.js";
import CustomerModel from "../_models/customers.js";
const upload = multer()
import { getConfig } from "../configStore.js";

router.post("/checkCallDetail",upload.none(), async (req, res) => {
  // const api = await saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    call_type: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(e => e.message);
    const result = {
      status: 0,
      errors: messages,
      message: 'Something went wrong',
      msg: messages.join('\n')
    };
    return res.json(result);
  }

  const { api_key, user_uni_id, astrologer_uni_id, call_type } = value;

  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateapiLogs(api, result);
    return res.json(result);
  }

  const resData = await checkCallDetail(astrologer_uni_id, call_type, user_uni_id); //errr

  const result = resData && Object.keys(resData).length > 0
    ? resData
    : {
        status: 0,
        msg: 'Something Went wrong.. Try Again'
      };

  // await updateapiLogs(api, result);
  return res.json(result);
});



router.post("/startVoiceCallExotel",upload.none(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);

  // 1. Joi validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    astrologer_id: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((d) => d.message).join("\n")
    };
    //   await updateApiLogs(apiLog, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id, astrologer_id } = value;

  // 2. Check API Key
  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
  //   await updateApiLogs(apiLog, result);
    return res.status(401).json(result);
  }

  // 3. Start voice call using your startCall logic
  const senddata = await startCall(
    { ...req.body, astrologer_uni_id: astrologer_id },
    "call"
  );
  const result = senddata
    ? senddata
    : {
        status: 0,
        msg: "Astrologer not available"
      };

  // await updateApiLogs(apiLog, result);
  
  
  return res.json(result);
});

router.post("/statusCallback",upload.none(), async (req, res) => {
  let result = {};
  // const apiLog = await saveApiLogs(req.body);

  try {
    const {
      CallSid: token,
      Status: status,
      StartTime: startTime,
      EndTime: endTime,
      ConversationDuration: duration,
      RecordingUrl = ""
    } = req.body;

    const calls = await getByToken(token);
    if (!calls) {
      result = { status: 0, msg: "Call not found" };
      // await updateApiLogs(apiLog, result);
      return res.status(404).json(result);
    }

    const { customer_uni_id: user_uni_id, astrologer_uni_id, uniqeid } = calls;

    if (status === "completed") {
      if (calls) {
        const sendData = {
          uniqeid,
          startTime,
          endTime,
          duration,
          RecordingUrl,
          call_type: "call"
        };

        result = await callTransations(sendData);
      }
    } else {
      // Optional custom mapping of statuses can be added here if needed
      // if (status === 'busy') {
      //   status = 'Declined(Astrologer)';
      // }

      const callHistory = await CallHistory.findOne({ where: { uniqeid } });
      if (callHistory) {
        await callHistory.update({ status });
      }

      await removeBusyStatus(astrologer_uni_id);

      if (astrologer_uni_id) {
        const waitingCustomers = await waitingCustomer(astrologer_uni_id);
        if (waitingCustomers?.call_type) {
          await startCall(waitingCustomers, waitingCustomers.call_type);
        }
      }
    }

    // await updateApiLogs(apiLog, result);
    return res.json(result);
  } catch (err) {
    console.error("Status callback error:", err);
    result = { status: 0, msg: "Internal Server Error", error:err.message };
    // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
});

router.post("/getCustomerQueueList",upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  try {
    // Validation
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map((err) => err.message);
      const result = {
        status: 0,
        errors: validationErrors,
        message: "Something went wrong",
        msg: validationErrors.join("\n"),
      };
      // await updateApiLogs(api, result);
      return res.json(result);
    }

    const attributes = value;
    const api_key = attributes.api_key;
    const user_uni_id = attributes.user_uni_id;

    // API key check
    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      const result = {
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      };
      // await updateApiLogs(api, result);
      return res.json(result);
    }

    // Get queue list
    const resData = await getCustomerQueueList(user_uni_id);
    
    let result;

    if (resData && resData.length > 0) {
      result = {
        status: 1,
        data: resData,
        msg: "List",
      };
    } else {
      result = {
        status: 0,
        msg: "No records found.",
      };
    }

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("getCustomerQueueList Error:", error);
    const result = {
      status: 0,
      msg: "Internal server error",
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }
});

router.post("/getAstrologerQueueList",upload.none(), async (req, res) => {
  // const api = await saveapiLogs(req.body); // Save request log

  // Joi validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
  });

  const { error, value: attributes } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorDetails = error.details.map(d => d.message);
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: errorDetails.join('\n'),
    };
    // await updateapiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id } = attributes;

  // Authorization check
  if (!await checkUserApiKey(api_key, user_uni_id)) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateapiLogs(api, result);
    return res.json(result);
  }

  let result;
  try {
    const queueList = await getAstrologerQueueList(user_uni_id);
    if (queueList && queueList.length > 0) {
      result = {
        status: 1,
        data: queueList,
        msg: "List",
      };
    } else {
      result = {
        status: 0,
        msg: "Something Went wrong.. Try Again",
      };
    }
  } catch (e) {
    result = {
      status: 0,
      msg: "Something Went wrong.. Try Again",
    };
  }
  
  // await updateapiLogs(api, result);
  return res.json(result);
});


router.post("/declineRequest",upload.none(), async (req, res) => {
  // const api = await saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    uniqeid: Joi.string().required(),
    status: Joi.string().required(),
  });

  const { error, value: attributes } = schema.validate(req.body);

  if (error) {
    const msg = error.details.map((d) => d.message).join("\n");
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg,
    };
    return res.json(result);
  }

  const { api_key, user_uni_id, uniqeid, status } = attributes;

  try {
    if (!checkUserApiKey(api_key, user_uni_id)) {
      const result = {
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      };
      return res.json(result);
    }

    const calls = await CallHistory.findOne({
      where: {
        uniqeid,
        status: {
          [Op.or]: ["queue", "queue_request", "request"],
        },
      },
    });

    if (!calls) {
      const result = {
        status: 0,
        msg: "Already Ended.",
      };
      // await updateapiLogs(api, result);
      return res.json(result);
    }

    const astrologer_uni_id = calls.astrologer_uni_id;
    const call_type = calls.call_type;
    const in_app_voice_call = calls.is_inapp_voice_call;

    await CallHistory.update({ status }, { where: { uniqeid } });
    await removeBusyStatus(astrologer_uni_id);

    const customer = await getCustomerById(calls.customer_uni_id);
    const astrologer = await Astrologer.findOne({
      where: { astrologer_uni_id: calls.astrologer_uni_id },
      include: [{ model: User, as: "user", attributes: ["user_fcm_token"] }],
    });

    if (status === "Declined(Customer)") {
      let astro_notification_desc = "Chat Declined by Customer";
      if (call_type === "video") {
        astro_notification_desc = "Video Call Declined by Customer";
      } else if (call_type === "call" && in_app_voice_call === 1) {
        astro_notification_desc = "Voice Call Declined by Customer";
      }

      const astroNotify = {
        title: customer.name,
        description: astro_notification_desc,
        chunk: [astrologer.user.user_fcm_token],
        type: "android",
        channelName: getConfig("company_name"),
        user_uni_id: calls.customer_uni_id,
        astrologer_uni_id: calls.astrologer_uni_id,
        duration: 0,
        start_time: getConfig("current_datetime"),
        notification_id: calls.id,
        cancel_status: 1,
      };

      await sendNotification(astroNotify);
    }

    if (status === "Declined(Astrologer)") {
      let cust_notification_desc = "Chat Declined by Astrologer";
      if (call_type === "video") {
        cust_notification_desc = "Video Call Declined by Astrologer";
      } else if (call_type === "call" && in_app_voice_call === 1) {
        cust_notification_desc = "Voice Call Declined by Astrologer";
      }

      const customerNotify = {
        title: astrologer.display_name,
        description: cust_notification_desc,
        chunk: [customer.user_fcm_token],
        type: "android",
        channelName: getConfig("company_name"),
        user_uni_id: calls.customer_uni_id,
        astrologer_uni_id: calls.astrologer_uni_id,
        duration: 0,
        start_time: getConfig("current_datetime"),
        click_action: "waitingTime", //"route("waitingTime")
        notification_id: calls.id,
        cancel_status: 1,
      };

      await sendNotification(customerNotify);
    }

    if (astrologer_uni_id) {
      const waitingCustomers = await waitingCustomer(astrologer_uni_id);
      if (waitingCustomers?.call_type) {
        await startCall(waitingCustomer, waitingCustomers.call_type);
      }
    }

    const result = {
      status: 1,
      msg: "Success",
    };

    // await updateapiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error("Error in declineRequest:", err);
    const result = {
      status: 0,
      msg: "Internal server error",
    };
    // await updateapiLogs(api, result);
    return res.json(result);
  }
});



router.post("/clearQueueRequest", upload.none(), async (req, res) => {});

router.post("/receiveVoiceCall", upload.none(), async (req, res) => {
  try {
    // Validation schema
    const schema = Joi.object({
      api_key: Joi.string().required(),
      astrologer_uni_id: Joi.string().required(),
      uniqeid: Joi.string().required(),
      is_joined: Joi.number().optional().allow(null,"")
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const result = {
        status: 0,
        errors: error.details,
        message: 'Something went wrong',
        msg: error.details.map(d => d.message).join('\n')
      };
      return res.status(400).json(result);
    }

    const { api_key, astrologer_uni_id, uniqeid, is_joined = 0 } = value;

    // Check API key
    const isValidUser = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isValidUser) {
      const result = {
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      };
      return res.status(401).json(result);
    }

    // Check Firebase custom auth token
    const firebase_custom_auth_token = await checkFirebaseCustomAuthToken(astrologer_uni_id);
    if (!firebase_custom_auth_token) {
      const result = {
        status: 0,
        msg: 'Please update your app and then re-login'
      };
      return res.status(400).json(result);
    }

    // Get call history
    const calls = await CallHistory.findOne({ 
      where: { uniqeid: uniqeid } 
    });

    if (!calls || !calls.customer_uni_id) {
      const result = {
        status: 0,
        msg: 'Invalid uniqeid'
      };
      return res.status(404).json(result);
    }

    let token = '';
    let minutes = 0;
    let second = 0;
    let is_call_in_progress = 0;

    // Get astrologer data
    const astrologer = await Astrologer.findOne({
      include: [{
        model: User,
        as: 'user',
        where: { user_uni_id: calls.astrologer_uni_id },
        required: true
      }]
    });

    if (astrologer) {
      // Generate Agora token
      const arry = {
        uniqeid: uniqeid,
        user_uni_id: astrologer.astrologer_uni_id,
        user_id: astrologer.user.id
      };
      
      const agoraTokenGen = await generateAgoraRtcToken(arry);
      if (agoraTokenGen && agoraTokenGen.token) {
        token = agoraTokenGen.token;
      }
    }

    // Handle call status and timing
    if (calls.status === 'request') {
      if (is_joined == 0) {
        const save_data = {
          // call_start: new Date().toISOString().slice(0, 19).replace('T', ' '),
          call_start: moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
          order_date: new Date().toISOString().slice(0, 10),
          status: 'in-progress'
        };
        await CallHistory.update(save_data, { where: { uniqeid: uniqeid } });
      }
      
      const remaining_time_in_second = calls.waiting_time;
      if (!isNaN(remaining_time_in_second) && remaining_time_in_second > 0) {
        minutes = Math.round((remaining_time_in_second / 60) * 100) / 100;
        second = remaining_time_in_second;
      }
    }

    if (token) {
      if (calls.status === 'in-progress') {
        const remaining_result = await remainingChatTime(uniqeid);
        if (remaining_result.remaining_time_in_second > 0) {
          minutes = remaining_result.minutes;
          second = remaining_result.remaining_time_in_second;
          is_call_in_progress = 1;
        }
      } else if (calls.status === 'request') {
        if (is_joined == 0) {
          const save_data = {
            // call_start: new Date().toISOString().slice(0, 19).replace('T', ' '),
            call_start: moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
            order_date: new Date().toISOString().slice(0, 10),
            status: 'in-progress'
          };
          await CallHistory.update(save_data, { where: { uniqeid: uniqeid } });
        }

        const remaining_time_in_second = calls.waiting_time;
        if (!isNaN(remaining_time_in_second) && remaining_time_in_second > 0) {
          minutes = Math.round((remaining_time_in_second / 60) * 100) / 100;
          second = remaining_time_in_second;
        }
      }

      // Get customer data
      const customer = await CustomerModel.findOne({
        where: { customer_uni_id: calls.customer_uni_id },
        include: [{
          model: User,
          as: 'user',
          required: true
        }]
      });

      if (customer) {
        const senddata = {
          name: customer.user.name || '',
          token: token
        };

        const result = {
          status: 1,
          msg: is_joined == 0 
            ? "You received voice call successfully" 
            : "You started voice call successfully",
          is_call_in_progress: is_call_in_progress,
          is_joined: is_joined,
          minutes: minutes,
          second: second,
          senddata: senddata
        };

        return res.json(result);
      } else {
        const result = {
          status: 0,
          msg: "Invalid Voice Call... Please Try Again"
        };
        return res.json(result);
      }
    } else {
      const result = {
        status: 0,
        msg: 'Oops! Cannot generate token. Please try again'
      };
      return res.json(result);
    }

  } catch (error) {
    console.error('Error in receiveVoiceCall:', error);
    const result = {
      status: 0,
      msg: 'Internal server error',
      error: error.message
    };
    return res.status(500).json(result);
  }
});

router.post("/getVoiceCallRequest", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  // Joi validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required()
  });

  const { error, value: attributes } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const msg = error.details.map((d) => d.message).join("\n");
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg
    };
    // await updateApiLogs(api, result);
    return res.status(400).json(result);
  }

  const { api_key, astrologer_uni_id } = attributes;

  const isValid = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again"
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  const resData = await getVoiceCallRequest(req); // Call helper function

  const result = Array.isArray(resData) && resData.length > 0
    ? {
        status: 1,
        msg: "Success",
        data: resData
      }
    : {
        status: 0,
        msg: "No voice call request found"
      };

  // await updateApiLogs(api, result);
  return res.json(result);
});

router.post("/startVoiceCall", upload.none(), async (req, res) =>  {
  // const api = await saveApiLogs(req.body);

  // Joi schema validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    astrologer_uni_id: Joi.string().required()
  });

  const { error, value: attributes } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const msg = error.details.map((d) => d.message).join("\n");
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg
    };
    // await updateApiLogs(api, result);
    return res.status(400).json(result);
  }

  // Add flag for in-app voice call
  const callRequest = {
    ...attributes,
    is_inapp_voice_call: 1
  };

  const senddata = await startCall(callRequest, "call");

  const result = senddata && senddata.status === 1
    ? senddata
    : {
        status: 0,
        msg: "Astrologer not available"
      };
console.log("StartVoiceCall Result::::::::::::::::::::::::::bhupendra:::::::::", result);

  // await updateApiLogs(api, result);
  return res.json(result);
});



router.post("/saveIntake", upload.none(), async (req, res) =>  {
  // const api = await saveApiLogs(req.body);
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    uniqeid: Joi.string().required(),

    name: Joi.string().allow(null, ''),
    dob: Joi.string().allow(null, ''),
    tob: Joi.string().allow(null, ''),
    birth_place: Joi.string().allow(null, ''),
    marital_status: Joi.string().allow(null, ''),
    occupation: Joi.string().allow(null, ''),
    topic: Joi.string().allow(null, ''),
    other: Joi.string().allow(null, ''),
    lat: Joi.string().allow(null, ''),
    long: Joi.string().allow(null, ''),
    partner_name: Joi.string().allow(null, ''),
    partner_gender: Joi.string().allow(null, ''),
    partner_dob: Joi.string().allow(null, ''),
    partner_tob: Joi.string().allow(null, ''),
    partner_birth_place: Joi.string().allow(null, ''),
    partner_lat: Joi.string().allow(null, ''),
    partner_long: Joi.string().allow(null, ''),
    gender: Joi.string().allow(null, ''),
    intake_type: Joi.string().required()
  });

  const { error, value: attributes } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((d) => d.message).join('\n'),
    };
    // await updateApiLogs(api, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id } = attributes;

  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  const result = await saveIntake(attributes);
  // await updateApiLogs(api, result);
  return res.json(result);
});

// Get user intakes list
router.post("/getIntakes", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().default(20)
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(e => e.message);
    return res.status(400).json({
      status: 0,
      error_code: 400,
      msg: messages.join(', ')
    });
  }

  const attributes = value;
  const isValidUser = await checkUserApiKey(attributes.api_key, attributes.user_uni_id);

  if (!isValidUser) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    });
  }

  const result = await getIntakes(attributes.user_uni_id, attributes.offset, attributes.limit);
  return res.json(result);
});

export default router;
