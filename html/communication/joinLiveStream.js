import express from "express";
import dotenv from "dotenv";
const router = express.Router();
dotenv.config();
import { Op, Sequelize } from "sequelize";
import Joi from "joi";
import moment from "moment";
import { constants } from "../_config/constants.js";
import User from "../_models/users.js";
import { getConfig } from '../configStore.js';
import { buildTokenWithUserAccount } from "../_helpers/RtcTokenBuilder.js";

import {
  checkUserApiKey,
  checkFirebaseCustomAuthToken,
  generateAgoraRtcToken,
  new_sequence_code,
  getAstrologerById,
  getCustomerById,
  getCurrency,
  getTotalBalanceById,
  getAstroPriceDataType,
  walletHistoryCreate
} from "../_helpers/common.js";
import multer from "multer";
import Astrologer from "../_models/astrologers.js";
import { checkOnlineStatus, getNotificationToFollowers } from "../astrologers/astrocommon.js";
import CallHistory from "../_models/call_history.js";
const upload = multer();

// const generateAgoraRtcToken = async (data = {}) => {
//   const appID = getConfig("agora_api_id");
//   const appCertificate = getConfig("agora_api_certificate");
//   const RolePublisher = 1;
//   const RoleSubscriber = 2;
//   const channelName = data.uniqeid;
  
//   // 🔧 FIXED: Use actual user_id instead of hardcoded 0
//   const user = data.user_id || 0;
  
//   const role = data.role === "audience" ? RoleSubscriber : RolePublisher;
//   const expireTimeInSeconds = 3600 * 24;
//   const currentTimestamp = Math.floor(Date.now() / 1000);
//   const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;
  
//   console.log('🔧 Agora Token Generation:', {
//     appID,
//     channelName,
//     user,
//     role: data.role,
//     roleValue: role,
//     user_id: data.user_id
//   });

//   const rtcToken = buildTokenWithUserAccount(
//     appID,
//     appCertificate,
//     channelName,
//     user,
//     role,
//     privilegeExpiredTs
//   );
  
//   console.log(' Generated Token:', rtcToken ? 'Success' : 'Failed');
  
//   return { token: rtcToken };
// };

router.post("/joinLiveStream", upload.none(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);

  // Joi validation schema
  const schema = Joi.object({
    user_uni_id: Joi.string().required(),
    api_key: Joi.string().required(),
    uniqeid: Joi.string().required(),
  });

 

  // Validate the request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n'),
    };
    // await updateApiLogs(apiLog, result);
    return res.status(400).json(result);
  }

  const { user_uni_id, api_key, uniqeid } = value;



  // Check API key
  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(apiLog, result);
    return res.status(401).json(result);
  }

  const firebaseToken = await checkFirebaseCustomAuthToken(user_uni_id);
  if (!firebaseToken) {
    const result = {
      status: 0,
      msg: 'Please update your app and then re-login',
    };
    // await updateApiLogs(apiLog, result);
    return res.status(403).json(result);
  }



  // Fetch user data
  const user = await User.findOne({ where: { user_uni_id } });

   

  if (!user) {
    const result = {
      status: 0,
      msg: 'User does not exist.',
    };
    // await updateApiLogs(apiLog, result);
    return res.status(404).json(result);
  }
 console.log("joinside",user_uni_id,uniqeid);
  // Generate token
  const sendData = await generateAgoraRtcToken({
    uniqeid,
    user_uni_id,
    role: 'audience',
  });

   

  if (sendData && sendData.token) {
    const result = {
      status: 1,
      data: sendData,
      msg: 'Success',
    };
    // await updateApiLogs(apiLog, result);
    return res.status(200).json(result);
  } else {
    const result = {
      status: 0,
      msg: 'Cannot generate token. Try Again',
    };
    // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
});

router.post('/startLiveStream', upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  const schema = Joi.object({
    astrologer_uni_id: Joi.string().required(),
    api_key: Joi.string().required(),
    status: Joi.number().valid(0, 1).required(),
    topic: Joi.string().allow('', null),
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

  const { api_key, astrologer_uni_id, status, topic } = value;

  const isValid = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const astro = await Astrologer.findOne({
    where: { astrologer_uni_id, live_permission: 1 },
  });

  if (!astro) {
    const result = {
      status: 0,
      msg: 'You do not have live streaming permission.',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  if (status === 0) {
    await astro.update({ live_status: 0 });
    const result = {
      status: 1,
      msg: 'You are Offline',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
  const live_expire_hours = constants.live_expire_hours || 2;

  if (
    astro.live_status === 1 &&
    astro.live_expire &&
    moment(currentDateTime).isBefore(moment(astro.live_expire))
  ) {
    const senddata = {
      token: astro.livetoken,
      uniqeid: astro.livechannel,
    };
    const result = {
      status: 1,
      data: senddata,
      msg: 'You are Online',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const uniqeid = await new_sequence_code('LIVEVIDEO');
  const user = await User.findOne({ where: { user_uni_id: astrologer_uni_id } });

  if (!user) {
    const result = {
      status: 0,
      msg: 'Astrologer does not exist.',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const rtcPayload = {
    uniqeid,
    user_uni_id: astrologer_uni_id,
    role: 'broadcaster',
  };

 console.log("startLive",astrologer_uni_id,uniqeid);

  const tokenData = await generateAgoraRtcToken(rtcPayload);

 
  
  if (!tokenData?.token) {
    const result = {
      status: 0,
      msg: 'Cannot generate token. Try Again',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const live_expire = moment().add(live_expire_hours, 'hours').format('YYYY-MM-DD HH:mm:ss');
  await astro.update({
    live_status: 1,
    online_status: 1,
    video_status: 0,
    call_status: 0,
    chat_status: 0,
    livetoken: tokenData.token,
    livechannel: uniqeid,
    live_expire,
    live_topic: topic || '',
  });

  tokenData.uniqeid = uniqeid;

  await getNotificationToFollowers({
    astrologer_uni_id,
    type: 'live',
  });

  await checkOnlineStatus(astrologer_uni_id);

  const result = {
    status: 1,
    data: tokenData,
    msg: 'You are Online',
  };
  // await updateApiLogs(api, result);
  return res.json(result);
});

router.post('/joinLiveCall', upload.none(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    call_type: Joi.string().required(),
    channel_name: Joi.string().allow(null, ''),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n'),
    };
    // await updateApiLogs(apiLog, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id, astrologer_uni_id, call_type } = value;

  try {
    // API Key check
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      const result = {
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      };
      // await updateApiLogs(apiLog, result);
      return res.status(401).json(result);
    }

    const astroDetail = await getAstrologerById(astrologer_uni_id);
    const customerData = await getCustomerById(user_uni_id);
    const currency = await getCurrency(user_uni_id);
    const balance = await getTotalBalanceById(user_uni_id);

    const astroPrices = await getAstroPriceDataType(
      astrologer_uni_id,
      call_type,
      currency,
      user_uni_id
    );

    let result;

    if (astroPrices?.price && astroPrices.price > 0) {
      const astroPrice = astroPrices.price;

      if (balance >= astroPrice) {
        const astrodata = {
          second: astroPrices.time_in_minutes * 60,
          minutes: astroPrices.time_in_minutes,
        };
        result = {
          status: 1,
          data: astrodata,
          msg: 'Successfully',
        };
      } else {
        result = {
          status: 0,
          msg: 'You Have Not Sufficient Balance Kindly Recharge',
        };
      }
    } else {
      result = {
        status: 0,
        msg: 'Astrologer not available for this service',
      };
    }

    // await updateApiLogs(apiLog, result);
    return res.json(result);
  } catch (err) {
    const result = {
      status: 0,
      msg: 'Something went wrong',
      error: err.message,
    };
    // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
});

router.post('/acceptLiveCall', upload.none(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);

  // Joi validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    call_type: Joi.string().required(),
    channel_name: Joi.string().allow(null, ''),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n'),
    };
    // await updateApiLogs(apiLog, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id, astrologer_uni_id, call_type, channel_name } = value;

  try {
    const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isAuthorized) {
      const result = {
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      };
      // await updateApiLogs(apiLog, result);
      return res.status(401).json(result);
    }

    const astroDetail = await getAstrologerById(astrologer_uni_id);
    const customerData = await getCustomerById(user_uni_id);
    const currency = await getCurrency(user_uni_id);

    const amount_balance = await getTotalBalanceById(user_uni_id);
    const astroPrices = await getAstroPriceDataType(astrologer_uni_id, call_type, currency, user_uni_id);

    let result;

    if (astroPrices?.price > 0) {
      const useAmount = astroPrices.price;
      let durationInSeconds = (astroPrices.time_in_minutes || 1) * 60;

      if (amount_balance >= useAmount) {
        let uniqeid = '';
        switch (call_type) {
          case 'callwithlive':
            uniqeid = await new_sequence_code('CALL');
            break;
          case 'videocallwithlive':
            uniqeid = await new_sequence_code('VIDEO');
            break;
          case 'privatecallwithlive':
            uniqeid = await new_sequence_code('PRIVATECALL');
            break;
          case 'privatevideocallwithlive':
            uniqeid = await new_sequence_code('PRIVATEVIDEO');
            break;
          default:
            uniqeid = await new_sequence_code('CALL');
        }

        const callHistoryData = {
          uniqeid,
          customer_uni_id: user_uni_id,
          astrologer_uni_id,
          duration: durationInSeconds,
          charge: useAmount,
          call_type,
          channel_name,
          order_date: getConfig("current_date"),
          call_start: getConfig("current_datetime"),
          status: 'completed',
        };

        await CallHistory.create(callHistoryData);

        const admin_percentage = astroDetail?.admin_percentage > 0
          ? astroDetail.admin_percentage
          : config.admin_percentage;

        const postAstroWalletHistoryData = {
          astrologer_uni_id,
          admin_percentage,
          user_uni_id,
          call_type,
          useAmount,
          duration: durationInSeconds,
          uniqeid,
        };

        await walletHistoryCreate(postAstroWalletHistoryData);

        result = {
          status: 1,
          msg: 'Successfully',
        };
      } else {
        result = {
          status: 0,
          msg: 'You Have Not Sufficient Balance Kindly Recharge',
        };
      }
    } else {
      result = {
        status: 0,
        msg: 'Astrologer not available for this service',
      };
    }

    // await updateApiLogs(apiLog, result);
    return res.json(result);
  } catch (err) {
    const result = {
      status: 0,
      msg: 'Something went wrong',
      error: err.message,
    };
    // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
});

export default router;