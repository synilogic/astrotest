import express from "express";
import dotenv from 'dotenv';
import bcryptjs from "bcryptjs";
import Joi from "joi";
import db from "../_config/db.js";
import authenticateToken from  "../_middlewares/auth.js";
import { formatDateTime } from "../_helpers/dateTimeFormat.js";
import { Op, Sequelize, literal } from "sequelize";
import moment  from "moment-timezone";
import LiveSchedule from "../_models/live_schedules.js";
import { generateUserApiKey,generateCustomerUniId,getUserData 
  ,generateAstrologerUniId,
  getAstrologerData,getAstroData,checkUserApiKey,getTotalBalanceById} from "../_helpers/common.js";
  import {getNoticeForApp } from "../_helpers/helper.js";
  import {inProgressChatDetailForAstrologer,astroTotalGiftIncome,
    currentRequestDetailForAstrologer,inProgressIntakeDetailForAstrologer,
    astroIncome,checkRunningSchedule,removeQueueList,userActivityUpdate,userActivityCreate,
    getNotificationToFollowers,checkOnlineStatus} from "./astrocommon.js";
import User from "../_models/users.js";
import ServiceOrder from "../_models/serviceOrder.js";
import Astrologer from "../_models/astrologers.js"
import AstrologerSkill from "../_models/astrologerSkills.js";
import AstrologerLanguage from "../_models/astrologerlanguage.js";
import AstrologerSchedule from "../_models/live_schedules.js";
import {getAstrologerQueueList} from "../_helpers/services/astrologersServices.js";
import Skills from "../_models/skills.js";
import Languages from "../_models/languages.js"; 
import CallHistory from "../_models/call_history.js";
import numberShorten from "../_helpers/numberShorten.js";
import multer from "multer";
import UserModel from "../_models/users.js";
import Bank from "../_models/banks.js";
import { constants, ROLE_IDS } from "../_config/constants.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
dotenv.config();
const router = express.Router();
const upload =multer();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


router.post("/getAstroDashbord", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
  });

  const { error, value: attributes } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((err) => err.message).join("\n"),
    });
  }

  try {
    const { api_key, astrologer_uni_id } = attributes;
    const user_uni_id = astrologer_uni_id;

    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      return res.status(200).json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }

    const userValidation = await User.findOne({ where: { user_uni_id } });

    const currentDateTime = moment()
      .add(process.env.SERVICE_AVAILABLE_MINUTES || 30, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');

    const availableService = await ServiceOrder.findOne({
      where: {
        astrologer_uni_id: user_uni_id,
        status: 'approved',
      },
      [Op.and]: literal(`CONCAT(date, ' ', time) <= '${currentDateTime}'`),
    });

    const data = await getAstrologerData({
      phone: userValidation.phone,
      user_uni_id: userValidation.user_uni_id,
    }, true, req);

           const callCount = await CallHistory.findOne({
  attributes: [
    [literal(`IFNULL(SUM(IF(call_type = 'call', IFNULL(duration, 0), 0)), 0)`), 'total_call_duration'],
    [literal(`IFNULL(SUM(IF(call_type = 'chat', IFNULL(duration, 0), 0)), 0)`), 'total_chat_duration'],
  ],
  where: {
    astrologer_uni_id: data[0]?.astrologer_uni_id,
  },
  raw: true,
});



    if (Array.isArray(data) && data.length > 0) {
      const today = moment().format('YYYY-MM-DD');
      const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

      const firstDateThisMonth = moment().startOf('month').format('YYYY-MM-DD');
      const lastDateThisMonth = moment().endOf('month').format('YYYY-MM-DD');

      const firstDateLastMonth = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
      const lastDateLastMonth = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

      const todayEarning = await astroIncome(user_uni_id, today, today);
      const yesterdayEarning = await astroIncome(user_uni_id, yesterday, yesterday);
      const thisMonthEarning = await astroIncome(user_uni_id, firstDateThisMonth, lastDateThisMonth);
      const lastMonthEarning = await astroIncome(user_uni_id, firstDateLastMonth, lastDateLastMonth);
      const totalEarning = await astroIncome(user_uni_id);
      const totalBalance = await getTotalBalanceById(user_uni_id);

   

      data[0].follows = 0;
      data[0].today_earning = todayEarning ? +parseFloat(todayEarning).toFixed(2) : 0;
      data[0].yesterday_earning = yesterdayEarning ? +parseFloat(yesterdayEarning).toFixed(2) : 0;
      data[0].this_month_earning = thisMonthEarning ? +parseFloat(thisMonthEarning).toFixed(2) : 0;
      data[0].last_month_earning = lastMonthEarning ? +parseFloat(lastMonthEarning).toFixed(2) : 0;
      data[0].total_earning = totalEarning ? +parseFloat(totalEarning).toFixed(2) : 0;
      data[0].total_balance = totalBalance ? +parseFloat(totalBalance).toFixed(2) : 0;

      data[0].avalable_service = availableService || '';
      data[0].notice = await getNoticeForApp();
      data[0].in_progress_order = await inProgressChatDetailForAstrologer(user_uni_id);
      data[0].astro_total_gift_balance = String(await astroTotalGiftIncome(user_uni_id));
      data[0].request_type = await currentRequestDetailForAstrologer(user_uni_id);
      data[0].in_progress_intake = await inProgressIntakeDetailForAstrologer(user_uni_id);
      data[0].total_call_duration = numberShorten(callCount.total_call_duration / 60, 0) || "0";
      data[0].total_chat_duration = numberShorten(callCount.total_chat_duration / 60, 0) || "0";
      

    }

    return res.status(200).json({
      status: 1,
      data: data[0] || {},
      msg:"You are Logged in Successfully"
    });

  } catch (err) {
    console.error("Error in astrologer-dashboard:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
    });
  }
});


router.post("/getchat-astrologer", async (req, res) => {
  // Optional: const apiLog = await saveApiLogs(req.body);

  const schema = Joi.object({
    gender: Joi.string().optional(),
    skill: Joi.number().optional(),
    language: Joi.number().optional(),
    category: Joi.any().optional(),
    user_ios_token: Joi.string().optional(),
    user_fcm_token: Joi.string().optional(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: "Validation Error",
      msg: error.details.map((err) => err.message).join("\n"),
    };
    return res.status(400).json(result);
  }

  try {
    const { gender, skill, language } = value;

    // Build main where clause for Astrologer table
    const whereClause = {};
    if (gender) {
      whereClause.gender = { [Op.like]: `%${gender}%` };
    }

    const includeClause = [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "phone"],
        // You can add more filters on `User` if needed
      },
      {
        model: Skills,
        as: "skills",
        through: {
          attributes: [],
          where: skill ? { skill_id: skill } : undefined,
        },
        required: !!skill,
      },
      {
        model: Languages,
        as: "languages",
        through: {
          attributes: [],
          where: language ? { language_id: language } : undefined,
        },
        required: !!language,
      },
    ];

    const astrologers = await Astrologer.findAll({
      where: whereClause,
      include: includeClause,
    });

    const result =
      astrologers.length > 0
        ? {
            status: 1,
            count: astrologers.length,
            data: astrologers,
            msg: "success",
          }
        : {
            status: 0,
            msg: "empty",
          };

    return res.json(result);
  } catch (err) {
    console.error("getchat-astrologer error:", err);
    const result = {
      status: 0,
      msg: "Server Error",
      error: err.message,
    };
    return res.status(500).json(result);
  }
});

router.post('/astro-update-next-online-time', async (req, res) => {
  // const apiLog = await saveApiLogs(req.body); // Optional: Log API call

  // Validation schema
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    time: Joi.string().required(),
    date: Joi.string().required(),
    schedule_type: Joi.string().required(),
    topic: Joi.string().optional().allow('', null),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Validation error',
      msg: error.details.map(err => err.message).join('\n'),
    };
    // await updateApiLogs(apiLog, result);
    return res.status(400).json(result);
  }

  const { api_key, astrologer_uni_id, ...scheduleData } = value;

  // Check API key
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

  // Add status and astrologer ID
  scheduleData.status = 1;
  scheduleData.astrologer_uni_id = astrologer_uni_id;

  try {
    const createdSchedule = await AstrologerSchedule.create(scheduleData);
      
    const result = {
      status: 1,
      msg: 'Schedule updated successfully',
      data: createdSchedule, // Return the created data
    };
   // console.log("result here",result);
    // await updateApiLogs(apiLog, result);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error saving schedule:', err);
    const result = {
      status: 0,
      msg: 'Something went wrong while saving the schedule',
    };
    // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
});


router.post('/getAstrologerQueueList', async (req, res) => {
  // Validate request body
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Validation error',
      msg: error.details.map(err => err.message).join('\n'),
    });
  }

  const { api_key, user_uni_id } = value;

  // Check API key
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    const queueList = await getAstrologerQueueList(user_uni_id);

    if (queueList && queueList.length > 0) {
      return res.json({
        status: 1,
        data: queueList,
        msg: 'List',
      });
    } else {
      return res.json({
        status: 0,
        msg: 'No queue entries found.',
      });
    }
  } catch (err) {
    console.error('Error in /agetAstrologerQueueList:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong... Try again',
    });
  }
});

router.post("/updateOnlineStatus",upload.none(), async (req, res) => {
  //const apiLog = await saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().allow('', null),
  });

  const { error, value } = schema.validate(req.body);

if (error || !value) {
  const result = {
    status: 0,
    errors: error?.details || [],
    message: "Validation Failed",
    msg: error?.details?.map((e) => e.message).join("\n") || "Invalid input.",
  };
  return res.json(result);
}


  const { api_key, astrologer_uni_id, status } = value;

  if (!await checkUserApiKey(api_key, astrologer_uni_id)) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
   // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const runningSchedule = await checkRunningSchedule(astrologer_uni_id);

  let result = {};

  if (!runningSchedule) {
    if (status === '0') {
      const astroStatusUpdate = {
        online_status: '0',
        video_status: '0',
        call_status: '0',
        chat_status: '0',
        busy_status: '0',
        live_status: '0',
        no_response_count: '0',
      };

      await Astrologer.update(astroStatusUpdate, {
        where: { astrologer_uni_id },
      });

      await  removeQueueList(astrologer_uni_id, 'Declined(Astrologer Offline)');

      for (const key of Object.keys(astroStatusUpdate)) {
        await userActivityUpdate(key, astrologer_uni_id);
      }

      result = {
        status: 1,
        msg: "You are Offline",
      };
    } else {
      await Astrologer.update({ online_status: '1' }, {
        where: { astrologer_uni_id },
      });

      await userActivityCreate('online_status', status, astrologer_uni_id);

      const notifyData = {
        ...req.body,
        type: 'online',
      };
      await getNotificationToFollowers(notifyData);

      result = {
        status: 1,
        msg: "You are Online",
      };
    }
  } else {
    result = {
      status: 0,
      msg: "Right now, you have a consultation schedule running.",
    };
  }

  //await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/updateCallStatus', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  // 1. Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error || !value) {
    const result = {
      status: 0,
      errors: error?.details || [],
      message: 'Something went wrong',
      msg: error?.details?.map((e) => e.message).join('\n') || 'Validation failed',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id, status } = value;

  // 2. Auth check
  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  // 3. Check if there's a running consultation
  const runningSchedule = await checkRunningSchedule(astrologer_uni_id);

  let result = {};

  if (!runningSchedule) {
    if (status === '0') {
      // Go offline
      await Astrologer.update({ call_status: '0' }, { where: { astrologer_uni_id } });
  

      await removeQueueList(astrologer_uni_id, 'Declined(Astrologer Offline)', 'call');
      await userActivityUpdate('call_status', astrologer_uni_id);

      result = {
        status: 1,
        msg: 'You are Offline',
      };
    } else {
      // Go online
      await Astrologer.update({ call_status: '1' }, { where: { astrologer_uni_id } });
      await AstrologerSchedule.update({status: '0' }, { 
        where: {
          astrologer_uni_id,
          schedule_type: ['call'] 
        } 
      });

      await userActivityCreate('call_status', status, astrologer_uni_id);

      result = {
        status: 1,
        msg: 'You are online',
      };
    }

    await checkOnlineStatus(astrologer_uni_id);
  } else {
    result = {
      status: 0,
      msg: 'Right now, you have a consultation schedule running.',
    };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/updateChatStatus', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body); // optional

  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n'),
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id: user_uni_id, status } = value;

  if (!(await checkUserApiKey(api_key, user_uni_id))) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const runningSchedule = await checkRunningSchedule(user_uni_id);
  let result = {};

  if (!runningSchedule) {
    if (status === '0') {
      await Astrologer.update(
        { chat_status: '0' },
        { where: { astrologer_uni_id: user_uni_id } }
      );

    


      await removeQueueList(user_uni_id, 'Declined(Astrologer Offline)', 'chat');
      await userActivityUpdate('chat_status', user_uni_id);

      result = {
        status: 1,
        msg: 'You are Offline',
      };
    } else {
      await Astrologer.update(
        { chat_status: '1' },
        { where: { astrologer_uni_id: user_uni_id } }
      );

      await AstrologerSchedule.update({status: '0' }, { 
        where: {
          astrologer_uni_id: user_uni_id,
          schedule_type: ['chat'] 
        } 
      });

      await userActivityCreate('chat_status', status, user_uni_id);

      result = {
        status: 1,
        msg: 'You are Online',
      };
    }

    await checkOnlineStatus(user_uni_id);
  } else {
    result = {
      status: 0,
      msg: 'Right now, you have a consultation schedule running.',
    };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/updateVideoCallStatus', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n'),
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id: user_uni_id, status } = value;

  if (!(await checkUserApiKey(api_key, user_uni_id))) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const runningSchedule = await checkRunningSchedule(user_uni_id);

  let result = {};

  if (!runningSchedule) {
    if (status === '0') {
      await Astrologer.update(
        { video_status: '0' },
        { where: { astrologer_uni_id: user_uni_id } }
      );
    

      await removeQueueList(user_uni_id, 'Declined(Astrologer Offline)', 'video');
      await userActivityUpdate('video_status', user_uni_id);

      result = {
        status: 1,
        msg: 'You are Offline',
      };
    } else {
      await Astrologer.update(
        { video_status: '1' },
        { where: { astrologer_uni_id: user_uni_id } }
      );
      await AstrologerSchedule.update(
        { status: '0' }, 
        { 
          where: {
            astrologer_uni_id: user_uni_id,
            schedule_type: ['video'] // Update all types
          } 
        }
      );

      await userActivityCreate('video_status', status, user_uni_id);

      result = {
        status: 1,
        msg: 'You are Online',
      };
    }

    await checkOnlineStatus(user_uni_id);
  } else {
    result = {
      status: 0,
      msg: 'Right now, you have a consultation schedule running.',
    };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/updateOnlineStatus1', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().allow('', null)
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n')
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id, status } = value;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const astrologer = await Astrologer.findOne({
    where: { astrologer_uni_id }
  });

  if (!astrologer) {
    return res.json({
      status: 0,
      msg: 'Astrologer not found'
    });
  }

  let result = {};

  if (astrologer.online_status === 1 || status === '0') {
    const updateData = {
      online_status: '0',
      call_status: '0',
      chat_status: '0',
      video_status: '0'
    };

    const updateResult = await astrologer.update(updateData);

    for (const key of Object.keys(updateData)) {
      await userActivityUpdate(key, astrologer_uni_id);
    }

    result = updateResult
      ? {
          status: 1,
          msg: 'Status changed successfully & all statuses set to Off'
        }
      : {
          status: 0,
          msg: 'Something went wrong'
        };
  } else {
    const updateResult = await astrologer.update({
      online_status: status
    });

    await userActivityUpdate('online_status', astrologer_uni_id);

    result = updateResult
      ? {
          status: 1,
          msg: 'Status changed successfully'
        }
      : {
          status: 0,
          msg: 'Something went wrong'
        };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/updateVideoCallStatus1', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n')
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id, status } = value;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const astrologer = await Astrologer.findOne({
    where: { astrologer_uni_id }
  });

  if (!astrologer) {
    return res.json({
      status: 0,
      msg: 'Astrologer not found'
    });
  }

  let result = {};

  if (astrologer.online_status === 1) {
    const update = await astrologer.update({ video_status: status });

    await userActivityUpdate('video_status', astrologer_uni_id);

    result = update
      ? {
          status: 1,
          msg: 'Status changed successfully'
        }
      : {
          status: 0,
          msg: 'Already updated'
        };
  } else {
    result = {
      status: 0,
      msg: 'Please first activate Online Status'
    };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/updateCallStatus1', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n')
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id, status } = value;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const astrologer = await Astrologer.findOne({
    where: { astrologer_uni_id }
  });

  if (!astrologer) {
    return res.json({
      status: 0,
      msg: 'Astrologer not found'
    });
  }

  let result = {};

  if (astrologer.online_status === 1) {
    const updated = await astrologer.update({ call_status: status });

    await userActivityUpdate('call_status', astrologer_uni_id);

    result = updated
      ? {
          status: 1,
          msg: 'Status changed successfully'
        }
      : {
          status: 0,
          msg: 'Already updated'
        };
  } else {
    result = {
      status: 0,
      msg: 'Please first activate Online Status'
    };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/updateChatStatus1', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n')
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id, status } = value;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const astrologer = await Astrologer.findOne({
    where: { astrologer_uni_id }
  });

  if (!astrologer) {
    return res.json({
      status: 0,
      msg: 'Astrologer not found'
    });
  }

  let result = {};

  if (astrologer.online_status === 1) {
    const updated = await astrologer.update({ chat_status: status });

    await userActivityUpdate('chat_status', astrologer_uni_id);

    result = updated
      ? { status: 1, msg: 'Status changed successfully' }
      : { status: 0, msg: 'Already updated' };
  } else {
    result = {
      status: 0,
      msg: 'Please first activate Online Status'
    };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});



router.post("/updateNextOnlineTime", upload.none(), async (req, res) => {
  // Validation schema
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    time: Joi.string().required(),
    date: Joi.string().required(),
    schedule_type: Joi.string().required(),
    topic: Joi.string().allow('', null).optional(),
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

  const { api_key, astrologer_uni_id: user_uni_id } = attributes;

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
    // Add status to attributes
    attributes.status = 1;

    // Create the live schedule
    const liveSchedule = await AstrologerSchedule.create(attributes);

    if (liveSchedule) {
      const result = {
        status: 1,
        msg: 'Updated successfully',
      };
      return res.json(result);
    } else {
      const result = {
        status: 0,
        msg: 'Something went wrong',
      };
      return res.json(result);
    }
  } catch (err) {
    console.error("Error creating live schedule:", err);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong",
      error: err.message,
    });
  }
});


router.post('/updateEmergencyCallStatus', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  // 1. Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error || !value) {
    const result = {
      status: 0,
      errors: error?.details || [],
      message: 'Something went wrong',
      msg: error?.details?.map((e) => e.message).join('\n') || 'Validation failed',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id, status } = value;

  // 2. Auth check
  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  // 3. Check if there's a running consultation
  const runningSchedule = await checkRunningSchedule(astrologer_uni_id);

  let result = {};

  if (!runningSchedule) {
    if (status === '0') {
      // Go offline
      await Astrologer.update({ emergency_call_status: '0' }, { where: { astrologer_uni_id } });

      await removeQueueList(astrologer_uni_id, 'Declined(Astrologer Offline)', 'call');
      await userActivityUpdate('emergency_call_status', astrologer_uni_id);

      result = {
        status: 1,
        msg: 'You are Offline',
      };
    } else {
      // Go online
      await Astrologer.update({ emergency_call_status: '1' }, { where: { astrologer_uni_id } });

      await userActivityCreate('emergency_call_status', status, astrologer_uni_id);

      result = {
        status: 1,
        msg: 'You are online',
      };
    }

    await checkOnlineStatus(astrologer_uni_id);
  } else {
    result = {
      status: 0,
      msg: 'Right now, you have a consultation schedule running.',
    };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/updateEmergencyChatStatus', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  // 1. Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error || !value) {
    const result = {
      status: 0,
      errors: error?.details || [],
      message: 'Something went wrong',
      msg: error?.details?.map((e) => e.message).join('\n') || 'Validation failed',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id, status } = value;

  // 2. Auth check
  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  // 3. Check if there's a running consultation
  const runningSchedule = await checkRunningSchedule(astrologer_uni_id);

  let result = {};

  if (!runningSchedule) {
    if (status === '0') {
      // Go offline
      await Astrologer.update({ emergency_chat_status: '0' }, { where: { astrologer_uni_id } });

      await removeQueueList(astrologer_uni_id, 'Declined(Astrologer Offline)', 'chat');
      await userActivityUpdate('emergency_chat_status', astrologer_uni_id);

      result = {
        status: 1,
        msg: 'You are Offline',
      };
    } else {
      // Go online
      await Astrologer.update({ emergency_chat_status: '1' }, { where: { astrologer_uni_id } });

      await userActivityCreate('emergency_chat_status', status, astrologer_uni_id);

      result = {
        status: 1,
        msg: 'You are online',
      };
    }

    await checkOnlineStatus(astrologer_uni_id);
  } else {
    result = {
      status: 0,
      msg: 'Right now, you have a consultation schedule running.',
    };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/updateEmergencyVideoStatus', upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  // 1. Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error || !value) {
    const result = {
      status: 0,
      errors: error?.details || [],
      message: 'Something went wrong',
      msg: error?.details?.map((e) => e.message).join('\n') || 'Validation failed',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const { api_key, astrologer_uni_id, status } = value;

  // 2. Auth check
  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  // 3. Check if there's a running consultation
  const runningSchedule = await checkRunningSchedule(astrologer_uni_id);

  let result = {};

  if (!runningSchedule) {
    if (status === '0') {
      // Go offline
      await Astrologer.update({ emergency_video_status: '0' }, { where: { astrologer_uni_id } });

      await removeQueueList(astrologer_uni_id, 'Declined(Astrologer Offline)', 'video');
      await userActivityUpdate('emergency_video_status', astrologer_uni_id);

      result = {
        status: 1,
        msg: 'You are Offline',
      };
    } else {
      // Go online
      await Astrologer.update({ emergency_video_status: '1' }, { where: { astrologer_uni_id } });

      await userActivityCreate('emergency_video_status', status, astrologer_uni_id);

      result = {
        status: 1,
        msg: 'You are online',
      };
    }

    await checkOnlineStatus(astrologer_uni_id);
  } else {
    result = {
      status: 0,
      msg: 'Right now, you have a consultation schedule running.',
    };
  }

  // await updateapiLogs(apiLog, result);
  return res.json(result);
});

router.post('/getAstrologerProfile', upload.none(),async (req, res) => {
  // const apiLog = await saveApiLogs(req.body); 
  // Step 1: Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n')
    };
    // await updateApiLogs(apiLog, result);
    return res.status(400).json(result);
  }

  const { api_key, astrologer_uni_id } = value;

  // Step 2: Check auth
  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateApiLogs(apiLog, result);
    return res.status(401).json(result);
  }

  try {
    // Step 3: Get astrologer profile
    const astroData = await Astrologer.findOne({
      where: { astrologer_uni_id: astrologer_uni_id },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: []
        }
      ],
      attributes: [
        'id',
        'display_name',
        'house_no',
        'street_area',
        'city',
        'state',
        'country',
        'address',
        'landmark',
        'latitude',
        'longitude',
        'birth_date',
        'gender',
        'pin_code',
        'experience',
        'astro_img',
        'long_biography',
        [Sequelize.col('user.name'), 'name'],
        [Sequelize.col('user.email'), 'email']
      ]
    });

    if (!astroData) {
      const result = { status: 0, msg: 'Data Not Found' };
      // await updateApiLogs(apiLog, result);
      return res.status(404).json(result);
    }

    const user = astroData.user || {};

    astroData.name = user.name || '';
    astroData.email = user.email || '';

    astroData.astro_img = astroData.astro_img ? `${req.protocol}://${req.get("host")}/${constants.astrologer_image_path}${astroData.astro_img}` : `${req.protocol}://${req.get("host")}/${constants.default_astrologer_image_path}`

    // Step 4: Get bank details
    const bankDetail = await Bank.findOne({
      where: { astrologer_id: astrologer_uni_id }
    });

    bankDetail.dataValues.full_info = `${bankDetail.account_name} (${bankDetail.bank_name}) {${bankDetail.account_no}}`

    const result = {
      status: 1,
      data: astroData,
      bankDetail: bankDetail || null,
      msg: 'Fetch Data Successfully'
    };

    // await updateApiLogs(apiLog, result);
    return res.json(result);
  } catch (err) {
    console.error('getAstrologerProfile error:', err);
    const result = {
      status: 0,
      msg: 'Something went wrong'
    };
    // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
})

router.post('/updateAstrologerProfile', upload.any(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);
  
  const { astrologer_uni_id } = req.body;
  let userValidation = null;
  if (astrologer_uni_id) {
    userValidation = await User.findOne({ where: { user_uni_id: astrologer_uni_id } });
  }

  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string()
      .email()
      .max(50)
      .required()
      .external(async (value, helpers) => {
        const existing = await User.findOne({
          where: {
            email: value,
            role_id: ROLE_IDS.ASTROLOGER,
            trash: 0,
            id: { [Op.ne]: userValidation?.id },
          },
        });
        if (existing) throw new Error("Email already in use");
        return value;
      }),
    birth_date: Joi.string().required(),
    gender: Joi.string().required(),
    address: Joi.string().required(),
    house_no: Joi.string().required(),
    street_area: Joi.string().required(),
    landmark: Joi.string().required(),
    city: Joi.string().allow(null, ""),
    state: Joi.string().allow(null, ""),
    country: Joi.string().allow(null, ""),
    latitude: Joi.string().allow(null, ""),
    longitude: Joi.string().allow(null, ""),
    pin_code: Joi.string().required(),
    experience: Joi.string().required(),
    display_name: Joi.string().required(),
    astro_img: Joi.string().optional().allow(null, ""), // For file
    pan_no: Joi.string().optional(),
    is_bank_required: Joi.number().valid(0, 1).optional(),
    bank_name: Joi.when("is_bank_required", { is: 1, then: Joi.string().required(), otherwise: Joi.optional() }),
    account_no: Joi.when("is_bank_required", { is: 1, then: Joi.string().required(), otherwise: Joi.optional() }),
    account_type: Joi.when("is_bank_required", { is: 1, then: Joi.string().required(), otherwise: Joi.optional() }),
    ifsc_code: Joi.when("is_bank_required", { is: 1, then: Joi.string().required(), otherwise: Joi.optional() }),
    account_name: Joi.when("is_bank_required", { is: 1, then: Joi.string().required(), otherwise: Joi.optional() }),
  });

  try {
    await schema.validateAsync(req.body, { abortEarly: false });
  } catch (error) {
    return res.status(400).json({
      status: 0,
      message: "Validation failed",
      errors: error.details,
      msg: error.details.map(e => e.message).join("\n"),
    });
  }

  const {
    api_key,
    name,
    email,
    ...rest
  } = req.body;

  if (!(await checkUserApiKey(api_key, astrologer_uni_id))) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    });
  }

  const astro = await Astrologer.findOne({ where: { astrologer_uni_id } });
  if (!astro) {
    return res.json({ status: 0, msg: "Invalid astrologer" });
  }

  const updateAstrologer = {
    display_name: rest.display_name,
    birth_date: rest.birth_date,
    pin_code: rest.pin_code,
    experience: rest.experience,
    gender: rest.gender,
    house_no: rest.house_no,
    street_area: rest.street_area,
    landmark: rest.landmark,
    address: rest.address,
    city: rest.city,
    state: rest.state,
    country: rest.country,
    longitude: rest.longitude,
    latitude: rest.latitude,
  };

  const astroImgFolder = path.join(__dirname, "../public/uploads/astrologer/icon");

  [astroImgFolder].forEach(folder => {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  });

  const saveFileWithName = (fieldname, folder, customFilename) => {
    const file = req.files?.find(f => f.fieldname === fieldname);
    if (file) {
      const ext = path.extname(file.originalname) || ".jpg";
      const filename = `${customFilename}${ext}`;
      const fullPath = path.join(folder, filename);
      fs.writeFileSync(fullPath, file.buffer);
      return filename;
    }
    return null;
  };

  let astroImgFilename = astro.astro_img;

    const astroFile = req.files?.find(f => f.fieldname === "astro_img");
    if (astroFile) {
      if (astroImgFilename) {
        const oldPath = path.join(astroImgFolder, astroImgFilename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
     astroImgFilename = `${astrologer_uni_id}_astro_img.jpg`;
      const savePath = path.join(astroImgFolder, astroImgFilename);
      fs.writeFileSync(savePath, astroFile.buffer);
      updateAstrologer.astro_img = astroImgFilename;
    }

  // Handle Image Upload
  // if (req.file) {
  //   const imgPath = constants.astrologer_image_path; // e.g., 'public/uploads/astrologer/'
  //   const filename = await UploadImage(req, imgPath, "astro_img");
  //   updateAstrologer.astro_img = filename;
  // }

  await astro.update(updateAstrologer);

  const updateUser = { name, email };
  if (rest.pan_no) updateUser.pan_no = rest.pan_no;

  await User.update(updateUser, { where: { user_uni_id: astrologer_uni_id } });

  // Handle Bank
  if (rest.is_bank_required == 1) {
    const bankData = {
      astrologer_id: astrologer_uni_id,
      bank_name: rest.bank_name,
      account_no: rest.account_no,
      account_type: rest.account_type,
      ifsc_code: rest.ifsc_code,
      account_name: rest.account_name,
    };

    const bankExists = await Bank.findOne({ where: { astrologer_id: astrologer_uni_id } });
    if (bankExists) {
      await Bank.update(bankData, { where: { astrologer_id: astrologer_uni_id } });
    } else {
      await Bank.create(bankData);
    }
  }

  // Reload final data
  const finalAstroData = await Astrologer.findOne({
    where: { astrologer_uni_id },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["name", "email"],
      },
    ],
  });

  const bankDetail = await Bank.findOne({ where: { astrologer_id: astrologer_uni_id } });

  const result = {
    status: 1,
    data: finalAstroData,
    bankDetail,
    msg: "Save Data Successfully",
  };

  // await updateApiLogs(apiLog, result);
  return res.json(result);
})


export default router;