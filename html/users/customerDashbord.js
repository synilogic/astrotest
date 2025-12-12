import express from "express";
import dotenv from "dotenv";
import Joi from "joi";
import path from "path";
import fs from "fs"; 

import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from "url";
import Customer from "../_models/customers.js";
import Language from "../_models/languages.js";
import Skill from "../_models/skills.js";
import AstrologerDocument from "../_models/astrologer_documents.js";
import ApiLog from "../_models/api_logs.js";
import AstrologerDiscount from "../_models/astrologer_discounts.js";

import AstrologerDiscountAssign from "../_models/astrologer_discount_assigns.js";
import AstrologerGallery from "../_models/astrologer_galleries.js";
import AstrologerGift from "../_models/astrologer_gifts.js";
import AdminApiLog from "../_models/admin_api_logs.js";
import CallHistory from "../_models/call_history.js";
import User from "../_models/users.js";
import AstrologerSchedule from "../_models/live_schedules.js";
import moment from "moment";
import axios from 'axios';
import authenticateToken from "../_middlewares/auth.js";
import {
  generateUserApiKey,
  generateCustomerUniId,
  getUserData,
  generateAstrologerUniId,
  getAstrologerData,
  checkUserApiKey,UploadImage,
} from "../_helpers/common.js";

import { formatDateTime } from "../_helpers/dateTimeFormat.js";

import { constants, imagePath, ROLE_IDS } from "../_config/constants.js";

import Order from "../_models/order.js";
import City from "../_models/city.js";
import { OfflineServiceCategory, getProductCategory, ServiceCategory, getVideoSections, GroupPujaCategory, getNoticeForApp, getArchitectServiceInProgressStatusForCustomer, inProgressChatDetailForCustomer} from "../_helpers/helper.js";
import Banner from "../_models/banners.js";
import ChatChannel from "../_models/chatChannelModel.js";
import Category from "../_models/categories.js";
import Testimonial from "../_models/testimonials.js";
import ServiceOrder from "../_models/serviceOrder.js";
import { literal, Op, Sequelize } from "sequelize";
import Blog from "../_models/blog.js";
import Astrologer from "../_models/astrologers.js";
import Course from "../_models/courses.js";
import multer from "multer";
import dayjs from "dayjs";



 const upload = multer();
// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const router = express.Router();




router.post("/customerEdit", upload.any(), async (req, res) => {
  try {
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      name: Joi.string().required(),
      email: Joi.string().email().max(50).required(),
      phone: Joi.string().required(),
      birth_date: Joi.string().required(),
      birth_time: Joi.string()
        .pattern(/^([01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d$/)
        .required()
        .messages({ "string.pattern.base": `"birth_time" must be in HH:mm:ss format` }),
      birth_place: Joi.string().required(),
      latitude: Joi.string().optional().allow(null, ""),
      longitude: Joi.string().optional().allow(null, ""),
      gender: Joi.string().required(),
      customer_img: Joi.string().optional().allow(null, ""),
      city: Joi.string().optional().allow(null, ""),
      state: Joi.string().optional().allow(null, ""),
      country: Joi.string().optional().allow(null, ""),
      time_zone: Joi.string().optional().allow(null, ""),
      welcome_mail: Joi.number().optional().allow(null),
    });

    const { error, value: attributes } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 0,
        errors: error.details,
        message: "Validation error",
        msg: error.details.map((err) => err.message).join("\n"),
      });
    }

    const { api_key, user_uni_id } = attributes;

    if (!(await checkUserApiKey(api_key, user_uni_id))) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }

    const userValidation = await User.findOne({ where: { user_uni_id } });
    const customer = await Customer.findOne({ where: { customer_uni_id: user_uni_id } });

    if (!userValidation || !customer) {
      return res.status(404).json({ status: 0, msg: "User or Customer not found" });
    }

    const emailUser = await User.findOne({
      where: {
        email: attributes.email,
        role_id: 4,
        trash: 0,
        user_uni_id: { [Op.ne]: user_uni_id },
      },
    });
    if (emailUser) {
      return res.status(400).json({ status: 0, msg: "Email already exists for another customer" });
    }

    const phoneUser = await User.findOne({
      where: {
        phone: attributes.phone,
        role_id: 4,
        trash: 0,
        user_uni_id: { [Op.ne]: user_uni_id },
      },
    });
    if (phoneUser) {
      return res.status(400).json({ status: 0, msg: "Phone already exists for another customer" });
    }

    const imgPath = path.join(__dirname, "../public/uploads/customers");
    if (!fs.existsSync(imgPath)) fs.mkdirSync(imgPath, { recursive: true });

    const uploadedFile = req.files?.find(file => file.fieldname === "customer_img");
    if (uploadedFile) {
      if (customer.customer_img) {
        const oldImagePath = path.join(imgPath, customer.customer_img);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }

      const extension = path.extname(uploadedFile.originalname) || ".jpg";
      const filename = `${uuidv4()}${extension}`;
      const targetPath = path.join(imgPath, filename);

      if (uploadedFile.buffer) {
        fs.writeFileSync(targetPath, uploadedFile.buffer);
        attributes.customer_img = filename;
      } else if (uploadedFile.path) {
        fs.renameSync(uploadedFile.path, targetPath);
        attributes.customer_img = filename;
      }
    } else if (attributes.customer_img) {
      // Handle base64 or URL image
      if (customer.customer_img) {
        const oldImagePath = path.join(imgPath, customer.customer_img);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }

      try {
        attributes.customer_img = await UploadImage(req, imgPath, "customer_img");
      } catch (err) {
        console.warn("Image upload error:", err.message);
        attributes.customer_img = customer.customer_img || "";
      }
    }

    await userValidation.update({
      name: attributes.name,
      email: attributes.email,
      phone: attributes.phone,
      role_id: 4,
    });

    const customerData = {
      gender: attributes.gender,
      birth_date: attributes.birth_date,
      birth_time: attributes.birth_time,
      birth_place: attributes.birth_place,
      country: attributes.country || "",
      state: attributes.state || "",
      city: attributes.city || "",
      latitude: attributes.latitude || "",
      longitude: attributes.longitude || "",
      time_zone: attributes.time_zone || "",
      customer_img: attributes.customer_img || customer.customer_img || "https://astro.synilogictech.com/uploads/offlne_service_category/1724738665-image.jpeg",
    };

    if (customer.process_status < 1) customerData.process_status = 1;

    await Customer.update(customerData, { where: { customer_uni_id: user_uni_id } });

    const data11 = await getUserData({ user_uni_id });
    let data;
    if (Array.isArray(data11) && data11.length > 0) {
      data = {
        ...data11[0].dataValues,
        ...(data11[0].user?.dataValues || {}),
        user_api_key: data11[0].dataValues.user_api_key,
      };
    } else if (data11?.dataValues) {
      data = {
        ...data11.dataValues,
        ...(data11.user?.dataValues || {}),
        user_api_key: data11.dataValues.user_api_key,
      };
    } else {
      data = data11;
    }

    if (data && data.user) delete data.user;
    data.user_fcm_token = data.user_fcm_token || "";
    data.user_ios_token = data.user_ios_token || "";
    data.firebase_auth_token = data.firebase_auth_token || "";

    if (!data.customer_img) {
      data.customer_img = "https://astro.synilogictech.com/uploads/offlne_service_category/1724738665-image.jpeg";
    }

    const userWithRelations = await Customer.findOne({
      where: { customer_uni_id: user_uni_id },
      include: [{ model: User, as: "user", where: { user_uni_id } }],
    });

    if (
      userWithRelations &&
      userWithRelations.user.welcome_mail !== 1 &&
      userWithRelations.user.email &&
      userWithRelations.user.process_status < 1
    ) {
      const sent = await SendNotification(user_uni_id, "welcome-template-for-customer");
      if (sent) {
        await User.update({ welcome_mail: 1 }, { where: { user_uni_id } });
      }
    }

    data.currency_code = "INR";
    data.currency_symbol = "₹";
    data.uid = customer.id;

    return res.json({
      status: 1,
      data: {
        id: data.id,
        customer_uni_id: data.customer_uni_id,
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        birth_date: data.birth_date,
        gender: data.gender,
        age: data.age ?? null,
       customer_img: data.customer_img
  ? `${req.protocol}://${req.get("host")}/uploads/customers/${data.customer_img}`
  : "https://karmleela.com/assets/img/customer.png",
        longitude: data.longitude || "",
        birth_place: data.birth_place || "",
        birth_time: data.birth_time,
        latitude: data.latitude || "",
        time_zone: data.time_zone || null,
        language: data.language || null,
        is_dosha_checked: data.is_dosha_checked ?? 0,
        is_pitra_dosha: data.is_pitra_dosha ?? 0,
        is_manglik_dosh: data.is_manglik_dosh ?? 0,
        is_kaalsarp_dosh: data.is_kaalsarp_dosh ?? 0,
        is_anonymous_review: data.is_anonymous_review ?? 0,
        process_status: data.process_status ?? 1,
        uid: data.uid,
        phone: data.phone,
        name: data.name,
        email: data.email,
        country_code: "+91",
        country_name: "India",
        user_fcm_token: data.user_fcm_token,
        user_ios_token: data.user_ios_token,
        firebase_auth_token: data.firebase_auth_token,
        status: 1,
        user_api_key: data.user_api_key,
        currency_code: "INR",
        currency_symbol: "₹",
      },
      currency_code: "INR",
      currency_symbol: "₹",
      msg: "User Data Successfully Updated",
    });
  } catch (err) {
    console.error("Error in /customerEdit:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal Server Error",
    });
  }
});

router.post("/customerDashboard", upload.none(), async (req, res) => {
  const attributes = { ...req.body };

  const userUniId = attributes.user_uni_id || '';
  const offset = 0;
  const status = 1;
  const limit = parseInt(constants.api_page_limit || '10');

  try {
    // Pass default filters to GroupPujaCategory if required
    attributes.offset = offset;
    attributes.status = status;
    attributes.limit = limit;

     const basePath = `${req.protocol}://${req.get("host")}/`;

    const [groupPujaCategory] = await Promise.all([
      GroupPujaCategory(attributes)
    ]);
  const updatedGroupPujaCategory =  groupPujaCategory.map((puja) => {

    puja.image = puja.image ? `${basePath}${constants.group_puja_category_image_path}${puja.image}` : "";

     puja.created_at = puja.created_at
        ? formatDateTime(puja.created_at)
        : "";
      puja.updated_at = puja.updated_at
        ? formatDateTime(puja.updated_at)
        : "";
return puja; 
  });


    const courseList = await Course.findAll({
      where: { status: 1 },
      limit,
      raw: true,
    });

    const updatedCourseList = courseList.map((course) => {
      // Safe fallback if no image or video
      course.course_image = course.course_image
        ? `${basePath}${imagePath.course_image_path}${course.course_image}`
        : "";

      course.video_url = course.video_url
        ? `${basePath}${imagePath.course_video_file_path}${course.video_url}`
        : "";

      course.created_at = course.created_at
        ? formatDateTime(course.created_at)
        : "";
      course.updated_at = course.updated_at
        ? formatDateTime(course.updated_at)
        : "";

      return course;
    });

    let inReview = {
      is_review: 0,
      id_for_review: "",
      display_name_for_review: "",
      uniqeid: "",
      astro_img: "",
    };

    if (userUniId) {
      const lastCall = await CallHistory.findOne({
        where: {
          customer_uni_id: userUniId,
          call_type: "call",
          status: "completed",
          is_review: 0,
        },
       include: [{ model: Astrologer, as: 'astrologer',}]
      });

      if (lastCall) {
        inReview = {
          is_review: lastCall.astrologer.astrologer_uni_id ? 0 : 0,
          id_for_review: lastCall.astrologer.astrologer_uni_id || "",
          display_name_for_review: lastCall.astrologer?.display_name || "",
          uniqeid: lastCall.uniqeid || "",
          astro_img: lastCall.astrologer?.astro_img || "",
        };
      }
    }

    const architectServiceStatus = await getArchitectServiceInProgressStatusForCustomer(userUniId);
    const inProgressChat = await inProgressChatDetailForCustomer(userUniId);

let chatChannels = "";
let transformedChatChannels = "";

if (userUniId) {
  const whereCondition = {
    trash: 0,
    [Op.or]: []
  };

  // Dynamic channel_name filtering
  if (userUniId.includes('CUS')) {
    whereCondition[Op.or].push(
      Sequelize.where(
        Sequelize.fn(
          'SUBSTRING_INDEX',
          Sequelize.fn('SUBSTRING_INDEX', Sequelize.col('channel_name'), '-', 1),
          '/',
          -1
        ),
        userUniId
      )
    );
  } else if (userUniId.includes('ASTRO')) {
    whereCondition[Op.or].push(
      Sequelize.where(
        Sequelize.fn('SUBSTRING_INDEX', Sequelize.col('channel_name'), '-', -1),
        userUniId
      )
    );
  } else {
    whereCondition.channel_name = { [Op.like]: `%${userUniId}%` };
  }

  chatChannels = await ChatChannel.findAll({
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['customer_img'],
        required: false,
        on: Sequelize.literal(
          `customer.customer_uni_id = SUBSTRING_INDEX(SUBSTRING_INDEX(ChatChannel.channel_name, '-', 1), '/', -1)`
        )
      },
      {
        model: Astrologer,
        as: 'astrologer',
        attributes: ['astro_img', 'display_name'],
        required: false,
        on: Sequelize.literal(
          `astrologer.astrologer_uni_id = SUBSTRING_INDEX(ChatChannel.channel_name, '-', -1)`
        )
      },
      {
        model: User,
        as: 'customerUser',
        attributes: ['user_uni_id', 'name'],
        required: false,
        on: Sequelize.literal(
          `customerUser.user_uni_id = SUBSTRING_INDEX(SUBSTRING_INDEX(ChatChannel.channel_name, '-', 1), '/', -1)`
        )
      }
    ],
    where: whereCondition,
    order: [['updated_at', 'DESC']],
    offset: offset,
    limit: parseInt(constants.customer_dashboard_chat_limit || '6'),
    attributes: ['id', 'channel_name', 'created_at', 'updated_at'],
  });

 const hostUrl = `${req.protocol}://${req.get("host")}/`;

 transformedChatChannels = chatChannels.map(channel => {
  const customer = channel.customer || {};
  const astrologer = channel.astrologer || {};
  const customerUser = channel.customerUser || {};

  const customerImg = customer.customer_img
    ? `${hostUrl}${constants.customer_image_path}${customer.customer_img}`
    : `${hostUrl}${constants.default_customer_image_path}`;

  const astroImg = astrologer.astro_img
    ? `${hostUrl}${constants.astrologer_image_path}${astrologer.astro_img}`
    : `${hostUrl}${constants.default_astrologer_image_path}`;

  return {
    id: channel.id,
    user_uni_id: null,
    channel_name: channel.channel_name,
    is_assistant_chat: channel.is_assistant_chat || 0,
    openai_thread_id: channel.openai_thread_id || null,
    status: channel.status || 0,
    trash: channel.trash || 0,
    created_at: formatDateTime(channel.created_at),
    updated_at: formatDateTime(channel.updated_at),
    customer_img: customerImg,
    astro_img: astroImg,
    display_name: astrologer.display_name || '',
    user_name: customerUser.name || ''
  };
});

}

   const dashboard = {
  is_review: inReview.is_review,
  id_for_review: inReview.id_for_review,
  display_name_for_review: inReview.display_name_for_review,
  in_review: inReview,
  in_progress_order: inProgressChat,
  architect_service_status: architectServiceStatus,
  chat_channels: transformedChatChannels,
  groupPujaCategory: updatedGroupPujaCategory,
  courseList: updatedCourseList,
};

    return res.json({
      status: 1,
      data: dashboard,
      msg: "Dashboard data",
    });
  } catch (error) {
    console.error("customerDashboard error:", error);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong",
    });
  }
});

export default router;