import express from "express";
import User from "../_models/users.js";
import Customer from "../_models/customers.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import dayjs from "dayjs";
import moment from "moment-timezone";
import authenticateToken from "../_middlewares/auth.js";
import CallHistory from "../_models/callHistoryModel.js";
import Astrologer from "../_models/astrologers.js";
import ChatChannel from "../_models/chatChannelModel.js";
import { Op, Sequelize, literal, QueryTypes } from "sequelize";
import { formatDateTime ,formatDateTime_crr} from "../_helpers/dateTimeFormat.js";
const router = express.Router();
dotenv.config();
import Joi from "joi";
import {
  startCall,
  checkUserApiKey,
  removeBusyStatus,
  getChatRequest,
  remainingChatTime,
  checkFirebaseCustomAuthToken,
  sendNotification,
  saveChat,
  getChatChannelHistory,
  waitingCustomer,
  callTransations,
  inProgressIntakeDetailForAstrologer,
  getIsChatAllowed,
  startAssistantChat,
  uploadOtherFiles,
  uploadImage,
  getCustomerById,
  declineCallRequest,
  declineChatRequest,
  declineVideoCallRequest,
  cronRefreshCall,
  getUserChatHistories
} from "../_helpers/common.js";
import { constants,imagePath } from "../_config/constants.js";
import multer from "multer";
import { getConfig } from "../configStore.js";
import ChatChannelHistory from "../_models/chatChannelHistoryModel.js";
import { fileURLToPath } from 'url';
import { log } from "console";

// // ES module compatible __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Move these lines up, before any usage of `upload`
// const uploadPath = path.join(__dirname, "../public/testuplods");
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// // Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
//     cb(null, `${base}_${Date.now()}${ext}`);
//   }
// });

// ensure upload dir exists
const uploadDir = path.join(process.cwd(), "../html/public/uploads/chat");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// multer storage
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/startChat", upload.any(), async (req, res) => {
  //Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    uniqeid: Joi.string().optional().allow(null, ""),
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
    //  Call helper method to initiate chat
    // Allow web apps to proceed without Firebase token
    req.body.allow_web_app = true;
    const sendData = await startCall(req.body, "chat");
    // Build response
    if (sendData) {
      return res.json(sendData);
    } else {
      return res.json({
        status: 0,
        msg: "Astrologer not available",
      });
    }
  } catch (err) {
    console.error("startChat error:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal Server Error",
      error: err.message,
    });
  }
});

router.post("/getChatRequest", upload.none(), async (req, res) => {
  const { api_key, astrologer_uni_id } = req.body;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  try {
    const basePath = `${req.protocol}://${req.get("host")}`;
    req.body.basePath = basePath;
    const amount_data = await getChatRequest(req.body);

    let result;
    if (amount_data && amount_data.length > 0) {
      result = {
        status: 1,
        msg: "Success",
        data: amount_data,
      };
    } else {
      result = {
        status: 0,
        msg: "Amount History data Was Empty!",
      };
    }
    return res.json(result);
  } catch (error) {
    console.error(error);
    const result = {
      status: 0,
      msg: "Internal Server Error",
    };
    return res.status(500).json(result);
  }
});

router.post("/reciveChat", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  // Input validation
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   const errorMsgs = errors.array().map((e) => e.msg);
  //   const result = {
  //     status: 0,
  //     errors: errors.mapped(),
  //     message: "Something went wrong",
  //     msg: errorMsgs.join("\n")
  //   };
  //   // await updateApiLogs(api, result);
  //   return res.status(422).json(result);
  // }

  const { api_key, astrologer_uni_id, uniqeid } = req.body;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  const firebaseToken = await checkFirebaseCustomAuthToken(astrologer_uni_id);

  if (!firebaseToken) {
    const result = {
      status: 0,
      msg: "Please update your app and then re-login",
    };
    // await updateApiLogs(api, result);
    return res.status(400).json(result);
  }

  const call = await CallHistory.findOne({ where: { uniqeid } });

  if (!call || !call.customer_uni_id) {
    const result = {
      status: 0,
      msg: "Invalid uniqeid",
    };
    // await updateApiLogs(api, result);
    return res.status(404).json(result);
  }

  let is_chat_in_progress = 0;
  let minutes = 0;
  let second = 0;

  if (call.status === "in-progress") {
    const remaining = await remainingChatTime(uniqeid);
    if (remaining.remaining_time_in_second > 0) {
      minutes = remaining.minutes;
      second = remaining.remaining_time_in_second;
      is_chat_in_progress = 1;
    }
  } else if (call.status === "request") {
    await CallHistory.update(
      {
        call_start: moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
        order_date: new Date().toISOString().slice(0, 10),
        status: "in-progress",
      },
      {
        where: { uniqeid },
      }
    );
  }
  
  const customer = await Customer.findOne({
    where: { customer_uni_id: call.customer_uni_id },
    include: [
      {
        model: User,
        as: "user",
        required: true,
        on: {
          user_uni_id: Sequelize.where(
            Sequelize.col("customers.customer_uni_id"),
            "=",
            Sequelize.col("user.user_uni_id")
          ),
        },
      },
    ],
  });

  if (customer) {
    const result = {
      status: 1,
      msg: "You received chat successfully",
      is_chat_in_progress,
      minutes,
      second,
    };
    // await updateApiLogs(api, result);
    
    return res.json(result);
  } else {
    const result = {
      status: 0,
      msg: "Invalid Chat... Please Try Again",
    };
    // await updateApiLogs(api, result);
    
    return res.status(400).json(result);
  }
});

router.post("/declineChatRequest", upload.none(), async (req, res) => {
  // const apiLogId = await saveApiLogs(req.body);

  const { api_key, user_uni_id, uniqeid, status } = req.body;

  // Basic validation
  if (!api_key || !user_uni_id || !uniqeid || !status) {
    const result = {
      status: 0,
      errors: {
        api_key: !api_key ? ["api_key is required"] : [],
        user_uni_id: !user_uni_id ? ["user_uni_id is required"] : [],
        uniqeid: !uniqeid ? ["uniqeid is required"] : [],
        status: !status ? ["status is required"] : [],
      },
      message: "Something went wrong",
      msg: "Missing required fields",
    };
    // await updateApiLogs(apiLogId, result);
    return res.status(400).json(result);
  }

  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  // const isValid = await checkUserApiKey(api_key, user_uni_id);
  // if (!isValid) {
  //   const result = {
  //     status: 0,
  //     error_code: 101,
  //     msg: 'Unauthorized User... Please login again',
  //   };
  //   // await updateApiLogs(apiLogId, result);
  //   return res.status(401).json(result);
  // }

  // Find call entry
  const call = await CallHistory.findOne({
    where: {
      uniqeid,
      status: {
        [Op.in]: ["queue", "queue_request", "request"],
      },
    },
  });

  if (!call) {
    const result = {
      status: 0,
      msg: "Already Ended.",
    };
    // await updateApiLogs(apiLogId, result);
    return res.status(200).json(result);
  }

  // Update status
  await CallHistory.update({ status }, { where: { uniqeid } });
  await removeBusyStatus(call.astrologer_uni_id);
  const customer = await getCustomerById(call.customer_uni_id);
  const astrologer = await Astrologer.findOne({
    include: {
      model: User,
      as: "user",
      where: { user_uni_id: call.astrologer_uni_id },
      required: true,
    },
  });

  const now = formatDateTime(new Date());
  const companyName = getConfig("company_name");

  if (status === "Declined(Customer)") {
    const astroNotify = {
      title: customer.name,
      description: "Chat Declined by Customer",
      chunk: [astrologer.user.user_fcm_token],
      type: call.call_type,
      channelName: companyName,
      user_uni_id: call.customer_uni_id,
      astrologer_uni_id: call.astrologer_uni_id,
      duration: 0,
      start_time: now,
      notification_id: call.id,
      cancel_status: 1,
    };
    await sendNotification(astroNotify);
  }

  if (status === "Declined(Astrologer Offline)") {
    const customerNotify = {
      title: astrologer.display_name,
      description: "Chat Declined by Astrologer",
      chunk: [customer.user_fcm_token],
      type: call.call_type,
      channelName: companyName,
      user_uni_id: call.customer_uni_id,
      astrologer_uni_id: call.astrologer_uni_id,
      duration: 0,
      start_time: now,
      click_action: `${process.env.BASE_URL}/waitingTime`,
      notification_id: call.id,
      cancel_status: 1,
    };
    await sendNotification(customerNotify);
  }

  const result = {
    status: 1,
    msg: "Success",
  };
  // await updateApiLogs(apiLogId, result);
  return res.json(result);
});

// router.post("/saveChat", upload.none(), async (req, res) => {
//   // const api = await saveapiLogs(req.body);

//   const schema = Joi.object({
//     api_key: Joi.string().required(),
//     user_uni_id: Joi.string().required(),
//     uniqeid: Joi.string().required(),
//     channel_name: Joi.string().allow(null, ""),
//     message: Joi.string().allow(null, ""),
//     parent_id: Joi.string().allow(null, ""),
//     selected_text: Joi.string().allow(null, ""),
//     selected_type: Joi.string().allow(null, ""),
//     file_url: Joi.string().allow(null, ""),
//     message_type: Joi.string().allow(null, ""),
//     call_type: Joi.string().allow(null, ""),
//     is_assistant_chat: Joi.number().allow(null),
//     is_first_chat: Joi.number().allow(null),
//     is_customer_birth_chat: Joi.number().allow(null),
//     slug: Joi.string().allow(null, ""),
//     lat: Joi.string().allow(null, ""),
//     lon: Joi.string().allow(null, ""),
//     tz: Joi.string().allow(null, ""),
//   });

//   const { error, value: attributes } = schema.validate(req.body, {
//     abortEarly: false,
//   });

//   if (error) {
//     return res.json({
//       status: 0,
//       errors: error.details,
//       message: "Something went wrong",
//       msg: error.details.map((err) => err.message).join("\n"),
//     });
//   }

//   try {
//     const { api_key, user_uni_id } = attributes;

//     const isValidUser = await checkUserApiKey(api_key, user_uni_id);
//     if (!isValidUser) {
//       const result = {
//         status: 0,
//         error_code: 101,
//         msg: "Unauthorized User... Please login again",
//       };
//       return res.json(result);
//     }

//     attributes.is_first_chat = attributes.is_first_chat ?? 1;
//     const message_type = attributes.message_type || "";
//     let filename = "";

//    const basePath = `${req.protocol}://${req.get("host")}/` || 'http://localhost:3000/';
//     if (attributes.file_url) {
//       const img = "file_url";
//       const imgPath = `${basePath}${imagePath.chat_file_path}` || 'uploads/chat/' ;


//       if (message_type === "Voice") {
//         filename = await uploadOtherFiles(req, imgPath, img, message_type);
//       } else if (message_type === "Image") {
//         filename = await uploadImage(req, imgPath, img);
//       } else if (
//         ["Product", "ManualServices", "Service"].includes(message_type)
//       ) {
//         filename = attributes.file_url;
//       }
//     }

//     attributes.file_url = filename;
//     attributes.call_type = attributes.call_type || "chat";
//     attributes.is_assistant_chat = attributes.is_assistant_chat || 0;
//     attributes.basePath = basePath;

//     const result = await saveChat(attributes);

//     // await updateapiLogs(api, result);
//     return res.json(result);
    
//   } catch (err) {
//     console.error("Error in saveChat:", err);
//     return res.status(500).json({
//       status: 0,
//       message: "Internal Server Error",
//       error: err.message,
//     });
//   }
// });

router.post(
  "/saveChat",
  upload.any(),               // accept any file fields
  async (req, res) => {
    // validate body
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      uniqeid: Joi.string().required(),
      channel_name: Joi.string().allow(null, ""),
      message: Joi.string().allow(null, ""),
      parent_id: Joi.string().allow(null, ""),
      selected_text: Joi.string().allow(null, ""),
      selected_type: Joi.string().allow(null, ""),
      file_url: Joi.string().allow(null, ""),
      message_type: Joi.string().allow(null, ""),
      call_type: Joi.string().allow(null, ""),
      is_assistant_chat: Joi.number().allow(null),
      is_first_chat: Joi.number().allow(null),
      is_customer_birth_chat: Joi.number().allow(null),
      slug: Joi.string().allow(null, ""),
      lat: Joi.string().allow(null, ""),
      lon: Joi.string().allow(null, ""),
      tz: Joi.string().allow(null, ""),
    });

    const { error, value: attributes } = schema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res.json({ status: 0, errors: error.details, msg: error.details.map(e => e.message).join("\n") });

    try {
      const { api_key, user_uni_id } = attributes;
      if (!(await checkUserApiKey(api_key, user_uni_id))) {
        return res.json({ status: 0, error_code: 101, msg: "Unauthorized User... Please login again" });
      }
    attributes.is_first_chat = attributes.is_first_chat ?? 1;
    const message_type = attributes.message_type || "";
      // decide file handling
      let filename = "";
      const basePath = `${req.protocol}://${req.get("host")}/`;

      if (message_type && req.files.length) {
        // find the file field named 'file_url'
        const fileObj = req.files.find(f => f.fieldname === 'file_url');
        
        const imgPath = `${uploadDir}`;
        if (fileObj) {
          if (message_type === "Voice" || message_type === "Pdf" || 
            message_type === "Document" || message_type === "File") {
            filename = await uploadOtherFiles(fileObj, imgPath, message_type);
          } else if (message_type === "Image") {
            filename = await uploadImage(fileObj, imgPath, message_type);
          }else if (["Product", "ManualServices", "Service"].includes(message_type)) {
            // For product/service types, use the filename directly
            filename = fileObj.filename;
          } else {
            // Default case: treat as general file
            filename = await uploadOtherFiles(fileObj, imgPath, message_type);
          }
        }
      }

      attributes.file_url = filename;
      attributes.call_type = attributes.call_type || "chat";
      attributes.is_assistant_chat = attributes.is_assistant_chat || 0;
      attributes.basePath = basePath;
      // attributes.file_url = filename ? `${basePath}communication/uploads/chat/${filename}` : "";
      

      const result = await saveChat(attributes);
      return res.json(result);
    } catch (err) {
      console.error("Error in saveChat:", err);
      return res.status(500).json({ status: 0, message: "Internal Server Error", error: err.message });
    }
  }
);

router.post("/getChatChannels", upload.none(), async (req, res) => {
  // const api = await saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    page: Joi.number().optional(),
    is_assistant_chat: Joi.any().optional(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  const { api_key, user_uni_id, page = 1, is_assistant_chat = 0 } = value;

  if (!(await checkUserApiKey(api_key, user_uni_id))) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    });
  }

  const page_limit = constants.api_page_limit_secondary;
  const offset = (page - 1) * page_limit;

  try {
    const whereCondition = {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn(
            "SUBSTRING_INDEX",
            Sequelize.col("channel_name"),
            "/",
            1
          ),
          { [Op.in]: ["ASSISTANT", "CHAT"] }
        ),
      ],
    };

    if (user_uni_id.includes("CUS")) {
      whereCondition[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "SUBSTRING_INDEX",
            Sequelize.fn(
              "SUBSTRING_INDEX",
              Sequelize.col("channel_name"),
              "-",
              1
            ),
            "/",
            -1
          ),
          user_uni_id
        ),
        { trash: 0 }
      );
    } else if (user_uni_id.includes("ASTRO")) {
      whereCondition[Op.and].push(
        Sequelize.where(
          Sequelize.fn(
            "SUBSTRING_INDEX",
            Sequelize.col("channel_name"),
            "-",
            -1
          ),
          user_uni_id
        )
      );
    } else {
      whereCondition.channel_name = { [Op.like]: `%${user_uni_id}%` };
    }

    if (is_assistant_chat == 0 || is_assistant_chat == 1) {
      whereCondition.is_assistant_chat = is_assistant_chat;
    }

    const chat_channels = await ChatChannel.findAll({
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: [],
          required: false,
          on: Sequelize.literal(
            "customer.customer_uni_id = SUBSTRING_INDEX(SUBSTRING_INDEX(ChatChannel.channel_name, '-', 1), '/', -1)"
          ),
        },
        {
          model: Astrologer,
          as: "astrologer",
          attributes: [],
          required: false,
          on: Sequelize.literal(
            "astrologer.astrologer_uni_id = SUBSTRING_INDEX(ChatChannel.channel_name, '-', -1)"
          ),
        },
        {
          model: User,
          as: "customerUser",
          attributes: [],
          required: false,
          on: Sequelize.literal(
            "customerUser.user_uni_id = SUBSTRING_INDEX(ChatChannel.channel_name, '-', -1)"
          ),
        },
        {
          model: User,
          as: "customerUser",
          attributes: [],
          required: false,
          on: Sequelize.literal(
            "customerUser.user_uni_id = SUBSTRING_INDEX(SUBSTRING_INDEX(ChatChannel.channel_name, '-', 1), '/', -1)"
          ),
        },
      ],
      where: whereCondition,
      order: [["updated_at", "DESC"]],
      offset,
      limit: page_limit,
      attributes: [
        "id",
        "channel_name",
        "status",
        "created_at",
        "updated_at",
        "trash",
        "is_assistant_chat",

        [Sequelize.col("customerUser.user_uni_id"), "user_uni_id"],
        [Sequelize.col("customerUser.name"), "name"],
        [Sequelize.col("astrologer.display_name"), "display_name"],
      ],
    });
    const formatted = await Promise.all(
      chat_channels.map(async (c) => {
        const data = c.toJSON();

        const basePath = `${req.protocol}://${req.get("host")}/`;

        const custImgPath = path.join(
          basePath,
          constants.customer_image_path || "uploads/customers",
          data.customer?.customer_img || ""
        );
        const astroImgPath = path.join(
          basePath,
          constants.astrologer_image_path || "uploads/astrologers",
          data.astrologer?.astro_img || ""
        );

        const getIsAllowed = await getIsChatAllowed(data.channel_name);

        let customer_uni_id = "";
        let astrologer_uni_id = "";

        if (data.channel_name) {
          const parts = data.channel_name.split("/");
          if (parts.length > 1) {
            const ids = parts[1].split("-");
            if (ids.length === 2) {
              [customer_uni_id, astrologer_uni_id] = ids;
            }
          }
        }

        return {
          ...data,
          user_name: data.name,
          customer_img:
            data.customer?.customer_img && fs.existsSync(custImgPath)
              ? `${basePath}${constants.customer_image_path}${data.customer.customer_img}`
              : `${basePath}${constants.default_customer_image_path}`,
          astro_img:
            data.astrologer?.astro_img && fs.existsSync(astroImgPath)
              ? `${basePath}${constants.astrologer_image_path}${data.astrologer.astro_img}`
              : `${basePath}${constants.default_astrologer_image_path}`,
          is_chat_allowed: getIsAllowed?.is_chat_allowed || 0,
          uniqeid: getIsAllowed?.uniqeid || "",
          customer_uni_id: getIsAllowed?.customer_uni_id || customer_uni_id,
          astrologer_uni_id:
            getIsAllowed?.astrologer_uni_id || astrologer_uni_id,
          created_at: formatDateTime(data.created_at),
          updated_at: formatDateTime(data.updated_at),
        };
      })
    );

    const result =
      formatted.length > 0
        ? {
            status: 1,
            data: formatted,
            page: page + 1,
            msg: "Saved Successfully.",
          }
        : { status: 0, msg: "No Record Found" };

    // await updateapiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error("getChatChannels error:", err);
    const result = {
      status: 0,
      msg: "Something went wrong",
      error: err.message,
    };
    // await updateapiLogs(api, result);
    return res.json(result);
  }
});

router.post("/getChatChannelHistory", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    channel_name: Joi.string().required(),
    first_msg_id: Joi.number().required(),
    is_assistant_chat: Joi.number().valid(0, 1).optional(),
    page: Joi.number().optional(),
  });

  const { error, value: attributes } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const msg = error.details.map((d) => d.message).join("\n");
    const response = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg,
    };
    // await updateApiLogs(api, response);
    return res.status(400).json(response);
  }

  const { api_key, user_uni_id } = attributes;

  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  try {
    // Add baseUrl BEFORE calling the function
    attributes.baseUrl = `${req.protocol}://${req.get("host")}/`;

    const chat_channel_history = await getChatChannelHistory(attributes);

    const result =
      !chat_channel_history || chat_channel_history.length === 0
        ? { status: 0, msg: "No Record Found" }
        : {
            status: 1,
            data: chat_channel_history,
            page: (attributes.page || 1) + 1,
            msg: "Saved Successfully.",
          };

    // await updateApiLogs(api, result);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in getChatChannelHistoryController:", err);
    const result = {
      status: 0,
      msg: "Internal Server Error",
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
});

router.post("/remainingChatTime", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    uniqeid: Joi.string().required(),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((e) => e.message).join("\n"),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, uniqeid } = attributes;

  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const call = await CallHistory.findOne({ where: { uniqeid } });

  if (!call) {
    const result = {
      status: 0,
      msg: "Invalid uniqeid",
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  let is_chat_in_progress = 0;
  let minutes = 0;
  let second = 0;

  if (call.status === "in-progress") {
    const remaining = await remainingChatTime(uniqeid);
    if (remaining && remaining.remaining_time_in_second > 0) {
      minutes = remaining.minutes;
      second = remaining.remaining_time_in_second;
      is_chat_in_progress = 1;
    }
  }

  const result =
    is_chat_in_progress === 1
      ? {
          status: 1,
          msg: "Get successfully",
          is_chat_in_progress,
          minutes,
          second,
        }
      : {
          status: 0,
          msg: "Chat is not initiated or expired",
        };

  // await updateApiLogs(api, result);
  return res.json(result);
});

router.post("/endChat", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    uniqeid: Joi.string().required(),
    duration: Joi.number().optional(),
    status: Joi.string().optional(),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((e) => e.message).join("\n"),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, uniqeid, duration: inputDuration } = attributes;

  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const call_end = dayjs(); // current time
  const call = await CallHistory.findOne({ where: { uniqeid } });

  let result;

  if (call?.call_start) {
    if (call.status && call.status !== "completed") {
      let duration = inputDuration;
      const callStart = dayjs(call.call_start);

      if (!duration) {
        duration = call_end.diff(callStart, "second");
      }

      const callEndTime = dayjs(callStart).add(duration, "second");

      if (duration && duration > 0) {
        const sendData = {
          uniqeid: call.uniqeid,
          startTime: call.call_start,
          endTime: callEndTime.format("YYYY-MM-DD HH:mm:ss"),
          duration,
          call_type: "chat",
        };

        result = await callTransations(sendData);
      } else {
        result = {
          status: 0,
          msg: "Duration is required",
        };
      }
    } else {
      result = {
        status: 0,
        msg: "Already updated.",
      };
    }
  } else {
    result = {
      status: 0,
      msg: "Call Not Received",
    };
  }

  const callHistory = await CallHistory.findOne({ where: { uniqeid } });

  if (callHistory?.astrologer_uni_id) {
    const waitingCust = await waitingCustomer(callHistory.astrologer_uni_id);
    if (waitingCust?.call_type) {
      await startCall(waitingCust, waitingCust.call_type);
    }
  }

  // await updateApiLogs(api, result);
  return res.json(result);
});

router.post("/inProgressIntakeDetailForAstrologer",upload.none(),async (req, res) => {
    // const api = await saveApiLogs(req.body);

    const schema = Joi.object({
      api_key: Joi.string().optional().allow(null, ""),
      astrologer_uni_id: Joi.string().optional().allow(null, ""),
    });

    const { error, value: attributes } = schema.validate(req.body);
    if (error) {
      const result = {
        status: 0,
        errors: error.details,
        message: "Something went wrong",
        msg: error.details.map((e) => e.message).join("\n"),
      };
      // await updateApiLogs(api, result);
      return res.json(result);
    }

    const { api_key, astrologer_uni_id } = attributes;

    const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isAuthorized) {
      const result = {
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      };
      // await updateApiLogs(api, result);
      return res.json(result);
    }

    const data = await inProgressIntakeDetailForAstrologer(astrologer_uni_id);

    const result =
      data && Object.keys(data).length > 0
        ? {
            status: 1,
            data,
            msg: "Get Successfully",
          }
        : {
            status: 0,
            msg: "No Record Found",
          };

    // await updateApiLogs(api, result);
    return res.json(result);
  }
);

router.post("/deleteChat", upload.none(), async (req, res) => {
  // const api = await saveapiLogs(req.body);

  // Validate request
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    id: Joi.number().required(),
  });

  const { error, value: attributes } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((e) => e.message).join("\n"),
    };
    return res.json(result);
  }
  const { api_key, user_uni_id, id } = attributes;
  try {
    // Check API Key
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      const result = {
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      };
      // await updateApiLogs(api, result);
      return res.json(result);
    }

    const chat_channel_history = await ChatChannelHistory.findOne({
      where: {
        id,
        [Op.and]: Sequelize.where(
          Sequelize.fn(
            "SUBSTRING_INDEX",
            Sequelize.fn(
              "SUBSTRING_INDEX",
              Sequelize.col("channel_name"),
              "-",
              1
            ),
            "/",
            -1
          ),
          user_uni_id
        ),
      },
    });
    let result;
    if (chat_channel_history) {
      if (chat_channel_history.trash === 0) {
        await chat_channel_history.update({ trash: 1 });

        result = {
          status: 1,
          msg: "Chat deleted successfully",
        };
      } else {
        result = {
          status: 0,
          msg: "Chat is already deleted",
        };
      }
    } else {
      result = {
        status: 0,
        msg: "No Record Found",
      };
    }
    // await updateapiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error("deleteChat error:", err);
    const result = {
      status: 0,
      msg: "Internal server error",
    };
    // await updateapiLogs(api, result);
    return res.json(result);
  }
});

router.post("/deleteChatChannel", upload.none(), async (req, res) =>{
  // const api = await saveApiLogs(req.body);

  // Validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    id: Joi.number().required()
  });

  const { error, value: attributes } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const msg = error.details.map((d) => d.message).join('\n');
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg
    };
    // await updateApiLogs(api, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id, id } = attributes;

  // API key check
  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again"
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  // Fetch chat channel using SUBSTRING_INDEX logic
  const chat_channel = await ChatChannel.findOne({
    where: {
      [Op.and]: [
        Sequelize.literal(`SUBSTRING_INDEX(SUBSTRING_INDEX(ChatChannel.channel_name, '-', 1), '/', -1) = '${user_uni_id}'`),
        { id }
      ]
    }
  });
  let result;
  if (chat_channel) {
    if (chat_channel.trash === 0) {
      await chat_channel.update({ trash: 1 });
      result = {
        status: 1,
        msg: "Chat history deleted successfully"
      };
    } else {
      result = {
        status: 0,
        msg: "Chat history is already deleted"
      };
    }
  } else {
    result = {
      status: 0,
      msg: "No Record Found"
    };
  }

  // await updateApiLogs(api, result);
  return res.json(result);
});

router.post("/startAssistantChat", upload.none(), async (req, res) =>{
  // const api = await saveApiLogs(req.body);

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

  const senddata = await startAssistantChat(attributes, "chat");

  const result = senddata && senddata.status === 1
    ? senddata
    : {
        status: 0,
        msg: "Invallid Astrologer"
      };

  // await updateApiLogs(api, result);
  return res.json(result);
});

// // Route: Upload files
// router.post("/testupload", upload.any(), async (req, res) => {
//   try {
//     const files = req.files || [];
//     const body = req.body;

//     if (!files.length) {
//       return res.status(400).json({
//         status: 0,
//         message: "No files were uploaded."
//       });
//     }

//     const uploadedFiles = files.map(file => ({
//       fieldName: file.fieldname,
//       originalName: file.originalname,
//       fileName: file.filename,
//       mimeType: file.mimetype,
//       size: file.size,
//       path: file.path
//     }));

//     return res.status(200).json({
//       status: 1,
//       message: "Files uploaded successfully.",
//       data: {
//         files: uploadedFiles,
//         formFields: body
//       }
//     });
//   } catch (error) {
//     console.error("Upload Error:", error);
//     return res.status(500).json({
//       status: 0,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// });


router.post("/endChatFromFirebase", upload.none(), async (req, res) => {
  // const api = await saveapiLogs(req.body);

  const schema = Joi.object({
    group_name: Joi.required(),
    previous_value: Joi.required(),
    new_value: Joi.required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map(d => d.message).join("\n"),
    });
  }

  const attributes = req.body;
  
  let result = {};
  const previous = attributes.previous_value || {};
  const current = attributes.new_value || {};

  const oldChatEnd = previous.chatEnd || false;
  const chatEnd = current.chatEnd || false;
  const uniqeid = current.chatId || "";
  let duration = "";
  const customer_status = current.customer_status || false;
  const astrologer_status = current.astrologer_status || false;

  const newChatAccepted = current.chatAccepted || false;
  const oldChatAccepted = previous.chatAccepted || false;
  let chatDeclinedBy = current.chatDeclinedBy || "";
  let type = current.type || "";


  if (uniqeid) {
    const calls = await CallHistory.findOne({
      where: {
        uniqeid,
        status: { [Op.ne]: "completed" },
      },
    });

    if (calls) {
      type = calls.call_type;
      const in_app_voice_call = calls.is_inapp_voice_call;

      if ((!oldChatEnd) && chatEnd) {
        // let call_end = new Date();
        let call_end = formatDateTime(new Date());

        // let call_end = formatDateTime(moment().local());

        // let call_end = formatDateTime_crr(new Date(), 'Asia/Kolkata');


       let call_start = formatDateTime_crr(calls.call_start)
       
        if (call_start) {
          if (calls.status === "in-progress") {
            const duration_server = Math.floor((new Date(call_end) - new Date(call_start)) / 1000);

            let duration = 0;
            if (duration_server > calls.waiting_time) {
              duration = calls.waiting_time;
              call_end = new Date(new Date(call_start).getTime() + duration * 1000);
            } else {
              duration = duration_server;
            }

            if (duration > 0) {
              const sendData = {
                uniqeid: calls.uniqeid,
                startTime: call_start,
                endTime: call_end,
                duration,
                call_type: type === "video" ? "video" : (type === "call" && in_app_voice_call ? "call" : "chat"),
              };
              result.value = await callTransations(sendData);
              
            } else {
              result.status = 0;
              result.msg = "Duration is required";
            }
          } else {
            result.status = 0;
            result.msg = "Already updated.";
          }
        } else {
          if (chatDeclinedBy === "Astrologer") {
            chatDeclinedBy = "Declined(Astrologer)";
          } else if (chatDeclinedBy === "Customer") {
            chatDeclinedBy = "Declined(Customer)";
          } else {
            chatDeclinedBy = "Session Expired";
          }

          if (type === "video") {
            await declineVideoCallRequest(uniqeid, chatDeclinedBy);
          } else if (type === "call") {
            await declineCallRequest(uniqeid, chatDeclinedBy);
          } else {
            await declineChatRequest(uniqeid, chatDeclinedBy);
          }
        }

        const callHistory = await CallHistory.findOne({ where: { uniqeid } });
        
        if (callHistory?.astrologer_uni_id) {
          const waitingCustomers = await waitingCustomer(callHistory.astrologer_uni_id);
          if (waitingCustomers?.call_type) {
            await startCall(waitingCustomers, waitingCustomers.call_type);
          }
        }
      } else if (!chatEnd && customer_status && astrologer_status && calls.status === "in-progress") {
        await calls.update({ customer_offline_at: null, astrologer_offline_at: null });
      } else if (!chatEnd && !customer_status && !astrologer_status && calls.status === "in-progress") {
        await calls.update({
          customer_offline_at: getConfig('current_datetime'),
          astrologer_offline_at: getConfig('current_datetime'),
        });
      } else if (!chatEnd && !customer_status && astrologer_status && calls.status === "in-progress") {
        await calls.update({
          customer_offline_at: getConfig('current_datetime'),
          astrologer_offline_at: null,
        });
      } else if (!chatEnd && customer_status && !astrologer_status && calls.status === "in-progress") {
        await calls.update({
          customer_offline_at: null,
          astrologer_offline_at: getConfig('current_datetime'),
        });
      } else if (!chatEnd && customer_status && calls.status === "in-progress") {
        await calls.update({ customer_offline_at: null });
      } else if (!chatEnd && !customer_status && calls.status === "in-progress") {
        await calls.update({ customer_offline_at: getConfig('current_datetime') });
      } else if (!chatEnd && astrologer_status && calls.status === "in-progress") {
        await calls.update({ astrologer_offline_at: null });
      } else if (!chatEnd && !astrologer_status && calls.status === "in-progress") {
        await calls.update({ astrologer_offline_at: getConfig('current_datetime') });
      } else if (oldChatEnd && chatEnd) {
        // Future enhancement block: already ended but repeated flag case
      }

      
      

      if (!oldChatAccepted && newChatAccepted) {
        const freshCall = await CallHistory.findOne({ where: { uniqeid } });
        

        if (freshCall) {
          const customer = await getCustomerById(freshCall.customer_uni_id);
          const astrologer = await Astrologer.findOne({
            where: { astrologer_uni_id: freshCall.astrologer_uni_id },
            include: [{ model: User, as: "user", required: true }],
          });

          if (customer?.user_fcm_token) {
            let notification_description = "Accepted Your Chat ...";
            if (type === "video") notification_description = "Accepted Your Video Call ...";
            else if (type === "call") notification_description = "Accepted Your Voice Call ...";

            const customerNotify = {
              title: astrologer?.display_name || "",
              description: notification_description,
              chunk: [customer.user_fcm_token],
              type: "android",
              channelName: getConfig("company_name"),
              user_uni_id: freshCall.customer_uni_id,
              astrologer_uni_id: freshCall.astrologer_uni_id,
              duration: 0,
              start_time: getConfig('current_datetime'),
              click_action:"waitingTime", //route("waitingTime"),
              notification_id: freshCall.id,
            };

            await sendNotification(customerNotify);
          }
        }
      }
    }
  }

  console.log("/endChatFromFirebase:::::::::::::::::::11:::::",result.value );
  console.log("/endChatFromFirebase:::::::::::22:::::::::::::", result );
  
  
  // await updateapiLogs(api, result.value || result);
  return res.json(result.value || result);
});



router.get("/cronRefreshCall", async (req, res) => {
  try {
    const result = await cronRefreshCall();
    console.log("result:::cronRefreshCall:::::::",result);
    
    return res.json(result);
  } catch (error) {
    console.error("Error in /cronRefreshCall:", error);
    return res.status(500).json({
      status: 0,
      message: "Something went wrong",
      error: error.message || error
    });
  }
});



// Get Admin Chat Channels
router.post("/getAdminChatChannels", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional().default(0),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  const { api_key, user_uni_id, offset } = value;

  if (!(await checkUserApiKey(api_key, user_uni_id))) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    });
  }

  const page_limit = constants.api_page_limit_secondary || 10;

  try {
    // Import AdminChatChannel model
    const { default: AdminChatChannel } = await import("../_models/admin_chat_channels.js");
    
    const whereCondition = {
      user_uni_id: user_uni_id,
      trash: 0,
    };

    const adminChatChannels = await AdminChatChannel.findAll({
      where: whereCondition,
      order: [["updated_at", "DESC"]],
      offset,
      limit: page_limit,
      attributes: [
        "id",
        "user_uni_id",
        "channel_name",
        "status",
        "trash",
        "created_at",
        "updated_at",
      ],
    });

    return res.json({
      status: 1,
      data: adminChatChannels,
      msg: "Admin chat channels retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching admin chat channels:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      error: err.message,
    });
  }
});

// Get Admin Chat Channel History (messages for a specific channel)
router.post("/getAdminChatChannelHistory", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    channel_name: Joi.string().optional().allow('', null),
    offset: Joi.number().integer().min(0).optional().default(0),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  const { api_key, user_uni_id, channel_name, offset } = value;

  if (!(await checkUserApiKey(api_key, user_uni_id))) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    });
  }

  const page_limit = constants.api_page_limit_secondary || 10;

  try {
    // Import AdminChatChannelHistory model
    const { default: AdminChatChannelHistory } = await import("../_models/admin_chat_channel_histories.js");
    
    const whereCondition = {
      user_uni_id: user_uni_id,
      trash: 0,
    };

    // If channel_name is provided, filter by it
    if (channel_name && channel_name.trim() !== '') {
      whereCondition.channel_name = channel_name;
    }

    const adminChatHistory = await AdminChatChannelHistory.findAll({
      where: whereCondition,
      order: [["created_at", "DESC"]],
      offset,
      limit: page_limit,
      attributes: [
        "id",
        "parent_id",
        "channel_name",
        "user_uni_id",
        "uniqeid",
        "message",
        "selected_text",
        "selected_type",
        "chat_intake_data",
        "file_url",
        "message_type",
        "status",
        "trash",
        "created_at",
        "updated_at",
      ],
    });

    return res.json({
      status: 1,
      data: adminChatHistory,
      msg: "Admin chat channel history retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching admin chat channel history:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      error: err.message,
    });
  }
});

// Get User Chat Histories (all chat channel histories for a user)
router.post("/getUserChatHistories", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    channel_name: Joi.string().optional().allow('', null),
    offset: Joi.number().integer().min(0).optional().default(0),
    limit: Joi.number().integer().min(1).max(100).optional().default(20)
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

  const { api_key, user_uni_id, channel_name, offset, limit } = value;

  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    });
  }

  try {
    const result = await getUserChatHistories(user_uni_id, offset, limit, channel_name);
    return res.json(result);
  } catch (err) {
    console.error("Error fetching user chat histories:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      error: err.message,
    });
  }
});

export default router;

