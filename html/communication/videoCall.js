import express from "express";
import dotenv from "dotenv";
const router = express.Router();
dotenv.config();
import { Op, Sequelize } from "sequelize";
import Joi from "joi";
import moment from "moment";
import { constants } from "../_config/constants.js";
import CallHistory from "../_models/call_history.js";
import Astrologer from "../_models/astrologers.js";
import CustomerModel from "../_models/customers.js";
import User from "../_models/users.js";
import {
  startCall,
  getVideoCallRequest,
  checkUserApiKey,
  checkFirebaseCustomAuthToken,
  generateAgoraRtcToken,
  remainingChatTime,
  callTransations,
  declineVideoCallRequest,
  getCustomerById,
  sendNotification
} from "../_helpers/common.js";

import { startVideoCall } from "../_helpers/videoCallService.js"
import multer from "multer";
import ServiceOrder from "../_models/serviceOrder.js";
import { getConfig } from "../configStore.js";
const upload = multer();

router.post("/startVideoCall", upload.none(), async (req, res) => {
  const requestData = req.body;

  // Save API log
  // const apiLogId = await saveApiLogs(requestData);

  // Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    astrologer_uni_id: Joi.string().required()
  });

  const { error } = schema.validate(requestData, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: errors.join("\n")
    };
    //   await updateApiLogs(apiLogId, result);
    return res.status(400).json(result);
  }


  // Call the API method to start a call
  const callResponse = await startCall(requestData, "video");
  


  let result;
  if (callResponse) {
    result = callResponse;
  } else {
    result = {
      status: 0,
      msg: "Astrologer not available"
    };
  }

  // await updateApiLogs(apiLogId, result);
  console.log(result);
  return res.json(result);
});

router.post("/getVideoCallRequest", upload.none(), async (req, res) => {
  try {
    const attributes = req.body;
    // const api = await saveapiLogs(req.body);

    const schema = Joi.object({
      api_key: Joi.string().required(),
      astrologer_uni_id: Joi.string().required()
    });

    const { error } = schema.validate(attributes, { abortEarly: false });

    if (error) {
      const errors = error.details.map((err) => err.message);
      const result = {
        status: 0,
        errors,
        message: "Something went wrong",
        msg: errors.join("\n")
      };
      return res.status(400).json(result);
    }

    const api_key = attributes.api_key;
    const astrologer_uni_id = attributes.astrologer_uni_id;

    if (!(await checkUserApiKey(api_key, astrologer_uni_id))) {
      const result = {
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again"
      };
      return res.status(401).json(result);
    }

    const resData = await getVideoCallRequest(req);

    let result;
    if (resData && resData.length > 0) {
      result = {
        status: 1,
        msg: "Success",
        data: resData
      };
    } else {
      result = {
        status: 0,
        msg: "No video call request found"
      };
    }

    // await updateapiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("Error in getVideoCallRequest:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      msg: "Something went wrong while processing your request"
    });
  }
});



router.post("/receiveVideoCall", upload.none(), async (req, res) => {
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

router.post("/endVideoCall", upload.none(), async (req, res) => {
  // const api = await saveapiLogs(req.body);

  try {
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      uniqeid: Joi.string().required(),
      declined_by: Joi.string().optional().allow(""),
      status: Joi.string().optional().allow(""),
      duration: Joi.number().optional() 
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.json({
        status: 0,
        errors: error.details,
        message: "Something went wrong",
        msg: error.details.map((d) => d.message).join("\n")
      });
    }

    const {
      api_key,
      user_uni_id,
      uniqeid,
      declined_by = "",
      status = ""
    } = value;

    const isValidUser = await checkUserApiKey(api_key, user_uni_id);
    if (!isValidUser) {
      const result = {
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again"
      };
      // await updateapiLogs(api, result);
      return res.json(result);
    }

    const call = await CallHistory.findOne({
      where: {
        uniqeid,
        status: { [Op.ne]: "completed" }
      }
    });

    if (!call) {
      const result = {
        status: 0,
        msg: "Your video call is not in in-progress"
      };
      // await updateapiLogs(api, result);
      return res.json(result);
    }

    const now = moment();
    const call_start = moment(call.call_start);
    let result;

    if (call.call_start) {
      if (call.status === "in-progress") {
        const duration_server = now.diff(call_start, "seconds");
        let call_end = now;
        let duration;

        if (duration_server > call.waiting_time) {
          duration = call.waiting_time;
          call_end = call_start.clone().add(duration, "seconds");
        } else {
          duration = duration_server;
        }

        if (duration > 0) {
          const sendData = {
            uniqeid: call.uniqeid,
            startTime: call.call_start,
            endTime: call_end.toISOString(),
            duration: duration,
            call_type: "video"
          };

          result = await callTransations(sendData);
        } else {
          result = {
            status: 0,
            msg: "Something Went wrong.. Try Again"
          };
        }
      } else {
        result = {
          status: 0,
          msg: "Your video call is not in in-progress"
        };
      }
    } else {
      let declinedStatus = "Session Expired";
      let msg = "Video call is successfully declined by User";

      if (declined_by === "Astrologer") {
        declinedStatus = "Declined(Astrologer)";
        msg = "Video call is successfully declined by Astrologer";
      } else if (declined_by === "Customer") {
        declinedStatus = "Declined(Customer)";
        msg = "Video call is successfully declined by Customer";
      }

      await declineVideoCallRequest(uniqeid, declinedStatus);

      result = {
        status: 1,
        msg
      };
    }

    // await updateapiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error("Error in endVideoCall:", err);
    const result = {
      status: 0,
      msg: "Something went wrong on the server.",
      error: err.message
    };
    // await updateapiLogs(api, result);
    return res.status(500).json(result);
  }
});

router.post("/endCallSendBird", upload.none(), async (req, res) => {});

router.post("./serviceVideoCall", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    order_id: Joi.string().required(),
    started_by: Joi.string().valid('Customer', 'Astrologer').required(),
    notification_status: Joi.number().optional(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(err => err.message).join('\n'),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, order_id, started_by, notification_status = 0 } = value;

  if (!await checkUserApiKey(api_key, user_uni_id)) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const currentTime = moment();
  const serviceorder = await ServiceOrder.findOne({ where: { order_id } });

  if (!serviceorder) {
    const result = { status: 0, msg: 'Invalid service' };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  if (serviceorder.status !== 'approved') {
    const result = { status: 0, msg: `Your service is ${serviceorder.status}` };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const serviceStart = moment(`${serviceorder.date} ${serviceorder.time}`);
  if (currentTime.isBefore(serviceStart)) {
    const result = {
      status: 0,
      msg: `Your service video call will start after ${serviceStart.format('YYYY-MM-DD HH:mm:ss')}`,
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const duration = serviceorder.available_duration;
  let available = 0;
  let minutes = 0;
  let second = 0;

  if (!serviceorder.start_time) {
    await serviceorder.update({ start_time: currentTime.toDate() });
    minutes = duration;
    second = duration * 60;
    available = 1;
  } else {
    const elapsed = moment().diff(moment(serviceorder.start_time), 'seconds');
    const remaining = (duration * 60) - elapsed;
    if (remaining > 0) {
      minutes = Math.round(remaining / 60);
      second = remaining;
      available = 1;
    }
  }

  if (second <= 0) {
    const result = { status: 0, msg: 'Your service time is over' };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const customer = await getCustomerById(serviceorder.customer_uni_id);
  const astrologer = await Astrologer.findOne({
    where: { astrologer_uni_id: serviceorder.astrologer_uni_id },
    include: [{ model: User, as: 'user' }],
  });

  let token = '';
  if (started_by === 'Customer') {
    const tokenRes = await generateAgoraRtcToken({
      uniqeid: order_id,
      user_uni_id: serviceorder.customer_uni_id,
      user_id: customer.id,
    });
    token = tokenRes?.token || '';
  } else if (started_by === 'Astrologer' && astrologer) {
    const tokenRes = await generateAgoraRtcToken({
      uniqeid: order_id,
      user_uni_id: astrologer.astrologer_uni_id,
      user_id: astrologer.id,
    });
    token = tokenRes?.token || '';
  }

  if (!token) {
    const result = { status: 0, msg: 'Oops! Cannot generate token. Please try again' };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  if (notification_status === 1) {
    const notifyData = {
      title: started_by === 'Customer' ? customer.name : astrologer.display_name,
      description: 'You Have a Service Video Call Request ...',
      chunk: [started_by === 'Customer' ? astrologer?.user?.user_fcm_token : customer?.user_fcm_token],
      type: 'service_video',
      channelName: getConfig("company_name"),
      user_uni_id: serviceorder.customer_uni_id,
      astrologer_uni_id: serviceorder.astrologer_uni_id,
      duration: 0,
      start_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      notification_id: serviceorder.id,
      cancel_status: 0,
    };
    await sendNotification(notifyData);
  }

  const result = {
    status: 1,
    msg: 'Service video call started successfully',
    minutes,
    second,
    available,
    token,
    customer,
    astrologer,
  };

  // await updateApiLogs(api, result);
  return res.json(result);
})

router.post("/remainingServiceVideoCallTime", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    order_id: Joi.string().required(),
    started_by: Joi.string().optional()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n')
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, order_id, started_by = '' } = value;

  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  let result;
  let minutes = 0;
  let second = 0;

  const serviceOrder = await ServiceOrder.findOne({ where: { order_id } });

  if (!serviceOrder) {
    result = {
      status: 0,
      msg: 'Invalid service'
    };
  } else if (serviceOrder.status !== 'approved') {
    result = {
      status: 0,
      msg: `Your service is ${serviceOrder.status}`
    };
  } else if (!serviceOrder.start_time) {
    result = {
      status: 0,
      msg: 'Service not yet started'
    };
  } else {
    const duration = serviceOrder.available_duration || 0;
    const startTime = moment(serviceOrder.start_time);
    const now = moment();
    const elapsedSeconds = now.diff(startTime, 'seconds');
    const totalDurationSeconds = duration * 60;
    const remainingSeconds = totalDurationSeconds - elapsedSeconds;

    if (remainingSeconds > 0) {
      minutes = Math.floor(remainingSeconds / 60);
      second = remainingSeconds;

      result = {
        status: 1,
        msg: 'Get service video call remaining time successfully',
        minutes,
        second
      };
    } else {
      result = {
        status: 0,
        msg: 'Your service time is over'
      };
    }
  }

  // await updateApiLogs(api, result);
  return res.json(result);
})


export default router;
