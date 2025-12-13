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

    // CRITICAL: Validate ID format - customer IDs should start with CUS, not VEND
    // Safely check user_uni_id (handle null/undefined)
    if (user_uni_id && typeof user_uni_id === 'string' && user_uni_id.startsWith('VEND')) {
      console.error('[customerEdit] ❌ CRITICAL: Vendor ID detected in customer endpoint!', {
        user_uni_id: user_uni_id,
        id_prefix: user_uni_id.length >= 4 ? user_uni_id.substring(0, 4) : user_uni_id,
        id_length: user_uni_id.length
      });
      return res.status(403).json({ 
        status: 0, 
        msg: `Invalid user ID format. Vendor IDs (VEND*) cannot use customer endpoints. Received ID: ${user_uni_id}` 
      });
    }

    console.log('[customerEdit] Request received:', {
      user_uni_id: user_uni_id,
      id_prefix: user_uni_id ? user_uni_id.substring(0, 3) : 'MISSING',
      api_key_length: api_key ? api_key.length : 0
    });

    if (!(await checkUserApiKey(api_key, user_uni_id))) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }

    // CRITICAL: Check user role first - this endpoint is ONLY for customers (role_id = 4)
    const userValidation = await User.findOne({ 
      where: { 
        user_uni_id: user_uni_id,
        trash: 0
      } 
    });

    if (!userValidation) {
      console.error('[customerEdit] User not found:', { 
        user_uni_id: user_uni_id,
        id_prefix: user_uni_id ? user_uni_id.substring(0, 3) : 'MISSING',
        id_length: user_uni_id ? user_uni_id.length : 0
      });
      return res.status(404).json({ 
        status: 0, 
        msg: `User not found with user_uni_id: ${user_uni_id}. Please check if the ID is correct and user exists in database.` 
      });
    }

    // CRITICAL: This endpoint is ONLY for customers (role_id = 4), not vendors (role_id = 5)
    if (userValidation.role_id !== ROLE_IDS.USER) {
      console.error('[customerEdit] Invalid role for this endpoint:', { 
        user_uni_id: user_uni_id, 
        role_id: userValidation.role_id,
        expected_role: ROLE_IDS.USER,
        is_vendor: userValidation.role_id === ROLE_IDS.VENDOR,
        user_name: userValidation.name,
        user_email: userValidation.email
      });
      return res.status(403).json({ 
        status: 0, 
        msg: `This endpoint is only for customers (role_id: ${ROLE_IDS.USER}). Your role_id is ${userValidation.role_id}. Vendors should use /vendor/vendor-update endpoint.` 
      });
    }

    // Only check for Customer record if user is actually a customer
    const customer = await Customer.findOne({ where: { customer_uni_id: user_uni_id } });

    if (!customer) {
      console.error('[customerEdit] Customer not found:', { 
        customer_uni_id: user_uni_id,
        user_role_id: userValidation.role_id,
        user_exists: !!userValidation,
        user_name: userValidation.name,
        // Check if there's a customer with similar ID (case/spacing issues)
        similar_ids_check: 'Check database for case/spacing mismatches'
      });
      
      // Try to find customer with case-insensitive search (safely handle null/undefined)
      let allCustomers = [];
      if (user_uni_id && typeof user_uni_id === 'string' && user_uni_id.length > 3) {
        try {
          allCustomers = await Customer.findAll({
            where: {
              customer_uni_id: {
                [Op.like]: `%${user_uni_id.substring(3)}%` // Check numeric part
              }
            },
            limit: 5
          });
        } catch (searchErr) {
          console.error('[customerEdit] Error searching for similar customer IDs:', searchErr);
        }
      }
      
      console.log('[customerEdit] Similar customer IDs found:', allCustomers.map(c => ({
        customer_uni_id: c?.customer_uni_id || 'N/A',
        id_length: c?.customer_uni_id ? c.customer_uni_id.length : 0
      })));
      
      return res.status(404).json({ 
        status: 0, 
        msg: `Customer not found with customer_uni_id: ${user_uni_id}. User exists (role_id: ${userValidation.role_id}) but Customer record is missing. This might indicate the customer record was never created or was deleted.` 
      });
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
      gender: attributes.gender || "",
      birth_date: attributes.birth_date || "",
      birth_time: attributes.birth_time || "00:00:00",
      birth_place: attributes.birth_place || "",
      country: attributes.country || "",
      state: attributes.state || "",
      city: attributes.city || "",
      latitude: attributes.latitude || "",
      longitude: attributes.longitude || "",
      time_zone: attributes.time_zone || "",
      customer_img: attributes.customer_img || customer?.customer_img || "https://astro.synilogictech.com/uploads/offlne_service_category/1724738665-image.jpeg",
    };

    // Safely check process_status (handle null/undefined)
    if (customer && (customer.process_status === null || customer.process_status === undefined || customer.process_status < 1)) {
      customerData.process_status = 1;
    }

    await Customer.update(customerData, { where: { customer_uni_id: user_uni_id } });

    const data11 = await getUserData({ user_uni_id });
    let data;
    
    // Safely parse getUserData response
    try {
      if (Array.isArray(data11) && data11.length > 0) {
        data = {
          ...(data11[0]?.dataValues || data11[0] || {}),
          ...(data11[0]?.user?.dataValues || data11[0]?.user || {}),
          user_api_key: data11[0]?.dataValues?.user_api_key || data11[0]?.user_api_key || "",
        };
      } else if (data11?.dataValues) {
        data = {
          ...(data11.dataValues || {}),
          ...(data11.user?.dataValues || data11.user || {}),
          user_api_key: data11.dataValues?.user_api_key || data11.user_api_key || "",
        };
      } else if (data11) {
        data = data11;
      } else {
        // Fallback: create minimal data object from customer and userValidation
        data = {
          ...(customer?.dataValues || customer || {}),
          ...(userValidation?.dataValues || userValidation || {}),
          customer_uni_id: user_uni_id,
          user_api_key: userValidation?.user_api_key || "",
        };
      }
    } catch (parseErr) {
      console.error('[customerEdit] Error parsing getUserData response:', parseErr);
      // Fallback: create minimal data object
      data = {
        ...(customer?.dataValues || customer || {}),
        ...(userValidation?.dataValues || userValidation || {}),
        customer_uni_id: user_uni_id,
        user_api_key: userValidation?.user_api_key || "",
      };
    }

    // Safely handle data object
    if (!data) {
      console.error('[customerEdit] Data is null/undefined after parsing');
      return res.status(500).json({
        status: 0,
        msg: "Failed to retrieve user data after update",
      });
    }

    if (data.user) delete data.user;
    data.user_fcm_token = data.user_fcm_token || "";
    data.user_ios_token = data.user_ios_token || "";
    data.firebase_auth_token = data.firebase_auth_token || "";

    if (!data.customer_img) {
      data.customer_img = "https://astro.synilogictech.com/uploads/offlne_service_category/1724738665-image.jpeg";
    }

    // Safely fetch user with relations (handle potential relation errors)
    let userWithRelations = null;
    try {
      userWithRelations = await Customer.findOne({
        where: { customer_uni_id: user_uni_id },
        include: [{ model: User, as: "user", where: { user_uni_id }, required: false }],
      });
    } catch (relationErr) {
      console.warn('[customerEdit] Error fetching user with relations (non-critical):', relationErr.message);
      // Continue without welcome email check
    }

    // Safely check welcome mail conditions
    if (
      userWithRelations &&
      userWithRelations.user &&
      userWithRelations.user.welcome_mail !== 1 &&
      userWithRelations.user.email &&
      (userWithRelations.user.process_status === null || userWithRelations.user.process_status === undefined || userWithRelations.user.process_status < 1)
    ) {
      try {
        const sent = await SendNotification(user_uni_id, "welcome-template-for-customer");
        if (sent) {
          await User.update({ welcome_mail: 1 }, { where: { user_uni_id } });
        }
      } catch (notifErr) {
        console.warn('[customerEdit] Error sending welcome notification (non-critical):', notifErr.message);
        // Continue - notification failure shouldn't block profile update
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
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      code: err.code,
      sql: err.sql,
      original: err.original
    });
    
    // Provide more specific error messages
    let errorMessage = "Internal Server Error";
    if (err.name === 'SequelizeValidationError') {
      errorMessage = `Validation error: ${err.errors?.map(e => e.message).join(', ') || err.message}`;
    } else if (err.name === 'SequelizeDatabaseError') {
      errorMessage = `Database error: ${err.message}`;
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      errorMessage = `Duplicate entry: ${err.errors?.map(e => e.message).join(', ') || err.message}`;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return res.status(500).json({
      status: 0,
      msg: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

router.post("/customerDashboard", upload.none(), async (req, res) => {
  const attributes = { ...req.body };

  const userUniId = attributes.user_uni_id || '';
  const offset = 0;
  const status = 1;
  const limit = parseInt(constants.api_page_limit || '10');

  // API key validation
  if (!attributes.api_key || !attributes.user_uni_id) {
    return res.status(400).json({
      status: 0,
      msg: 'Missing required fields: api_key and user_uni_id',
    });
  }

  const isValid = await checkUserApiKey(attributes.api_key, attributes.user_uni_id);
  if (!isValid) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    // Pass default filters to GroupPujaCategory if required
    attributes.offset = offset;
    attributes.status = status;
    attributes.limit = limit;

     const basePath = `${req.protocol}://${req.get("host")}/`;

    let groupPujaCategory = [];
    try {
      groupPujaCategory = await GroupPujaCategory(attributes);
    } catch (err) {
      console.error('[customerDashboard] Error fetching GroupPujaCategory:', err);
      groupPujaCategory = []; // Fallback to empty array
    }
    
    // Ensure it's an array
    if (!Array.isArray(groupPujaCategory)) {
      groupPujaCategory = [];
    }
    
  const updatedGroupPujaCategory =  groupPujaCategory.map((puja) => {
    // Create a new object to avoid mutating the original
    const updatedPuja = { ...puja };
    const imagePath = constants?.group_puja_category_image_path || 'uploads/group_puja_category/';
    updatedPuja.image = updatedPuja.image 
      ? `${basePath}${imagePath}${updatedPuja.image}` 
      : "";

    try {
      updatedPuja.created_at = updatedPuja.created_at
        ? formatDateTime(updatedPuja.created_at)
        : "";
      updatedPuja.updated_at = updatedPuja.updated_at
        ? formatDateTime(updatedPuja.updated_at)
        : "";
    } catch (err) {
      console.error('[customerDashboard] Error formatting puja dates:', err);
      updatedPuja.created_at = updatedPuja.created_at || "";
      updatedPuja.updated_at = updatedPuja.updated_at || "";
    }
    return updatedPuja; 
  });


    let courseList = [];
    try {
      courseList = await Course.findAll({
        where: { status: 1 },
        limit,
        raw: true,
      });
    } catch (err) {
      console.error('[customerDashboard] Error fetching Course list:', err);
      courseList = []; // Fallback to empty array
    }
    
    // Ensure it's an array
    if (!Array.isArray(courseList)) {
      courseList = [];
    }

    const updatedCourseList = courseList.map((course) => {
      // Create a new object to avoid mutating the original
      const updatedCourse = { ...course };
      // Safe fallback if no image or video
      const courseImagePath = imagePath?.course_image_path || 'uploads/course_image/';
      const courseVideoPath = imagePath?.course_video_file_path || 'uploads/course_video_file/';
      
      updatedCourse.course_image = updatedCourse.course_image
        ? `${basePath}${courseImagePath}${updatedCourse.course_image}`
        : "";

      updatedCourse.video_url = updatedCourse.video_url
        ? `${basePath}${courseVideoPath}${updatedCourse.video_url}`
        : "";

      try {
        updatedCourse.created_at = updatedCourse.created_at
          ? formatDateTime(updatedCourse.created_at)
          : "";
        updatedCourse.updated_at = updatedCourse.updated_at
          ? formatDateTime(updatedCourse.updated_at)
          : "";
      } catch (err) {
        console.error('[customerDashboard] Error formatting course dates:', err);
        updatedCourse.created_at = updatedCourse.created_at || "";
        updatedCourse.updated_at = updatedCourse.updated_at || "";
      }

      return updatedCourse;
    });

    let inReview = {
      is_review: 0,
      id_for_review: "",
      display_name_for_review: "",
      uniqeid: "",
      astro_img: "",
    };

    if (userUniId) {
      let lastCall = null;
      try {
        // Try to find call history with astrologer
        lastCall = await CallHistory.findOne({
          where: {
            customer_uni_id: userUniId,
            call_type: "call",
            status: "completed",
            is_review: 0,
          },
          include: [{
            model: Astrologer,
            as: 'astrologer',
            required: false,
            attributes: ['astrologer_uni_id', 'display_name', 'astro_img']
          }],
          raw: false, // Keep as Sequelize instance to access associations
          nest: true
        });
      } catch (err) {
        console.error('[customerDashboard] Error fetching CallHistory:', err);
        console.error('[customerDashboard] Error details:', {
          message: err.message,
          name: err.name,
          sql: err.sql
        });
        lastCall = null;
      }

      if (lastCall) {
        // Safely access astrologer data
        const astrologer = lastCall.astrologer || lastCall.get ? lastCall.get('astrologer') : null;
        if (astrologer) {
          inReview = {
            is_review: astrologer.astrologer_uni_id ? 0 : 0,
            id_for_review: astrologer.astrologer_uni_id || "",
            display_name_for_review: astrologer.display_name || "",
            uniqeid: lastCall.uniqeid || lastCall.get ? lastCall.get('uniqeid') : "",
            astro_img: astrologer.astro_img || "",
          };
        }
      }
    }

    let architectServiceStatus = {};
    let inProgressChat = {};
    try {
      architectServiceStatus = await getArchitectServiceInProgressStatusForCustomer(userUniId);
    } catch (err) {
      console.error('[customerDashboard] Error fetching architectServiceStatus:', err);
      architectServiceStatus = {};
    }
    try {
      inProgressChat = await inProgressChatDetailForCustomer(userUniId);
    } catch (err) {
      console.error('[customerDashboard] Error fetching inProgressChat:', err);
      inProgressChat = {};
    }

let chatChannels = [];
let transformedChatChannels = [];

if (userUniId) {
  try {
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
      limit: parseInt(constants?.customer_dashboard_chat_limit || '6'),
      attributes: ['id', 'channel_name', 'created_at', 'updated_at'],
    });
    
    // Ensure chatChannels is an array
    if (!Array.isArray(chatChannels)) {
      chatChannels = [];
    }
  } catch (err) {
    console.error('[customerDashboard] Error fetching ChatChannel:', err);
    chatChannels = []; // Fallback to empty array
  }
}

 const hostUrl = `${req.protocol}://${req.get("host")}/`;

 // Ensure chatChannels is an array before mapping
 if (Array.isArray(chatChannels)) {
   transformedChatChannels = chatChannels.map(channel => {
  const customer = channel.customer || {};
  const astrologer = channel.astrologer || {};
  const customerUser = channel.customerUser || {};

  const customerImgPath = constants?.customer_image_path || 'uploads/customers/';
  const defaultCustomerImgPath = constants?.default_customer_image_path || 'assets/img/customer.png';
  const astroImgPath = constants?.astrologer_image_path || 'uploads/astrologers/';
  const defaultAstroImgPath = constants?.default_astrologer_image_path || 'assets/img/astrologer.png';
  
  const customerImg = customer.customer_img
    ? `${hostUrl}${customerImgPath}${customer.customer_img}`
    : `${hostUrl}${defaultCustomerImgPath}`;

  const astroImg = astrologer.astro_img
    ? `${hostUrl}${astroImgPath}${astrologer.astro_img}`
    : `${hostUrl}${defaultAstroImgPath}`;

  return {
    id: channel.id,
    user_uni_id: null,
    channel_name: channel.channel_name,
    is_assistant_chat: channel.is_assistant_chat || 0,
    openai_thread_id: channel.openai_thread_id || null,
    status: channel.status || 0,
    trash: channel.trash || 0,
    created_at: channel.created_at ? (formatDateTime(channel.created_at) || "") : "",
    updated_at: channel.updated_at ? (formatDateTime(channel.updated_at) || "") : "",
    customer_img: customerImg,
    astro_img: astroImg,
    display_name: astrologer.display_name || '',
    user_name: customerUser.name || ''
  };
  });
 } else {
   transformedChatChannels = [];
 }

 // Fetch customer profile data including customer_img
 let customerProfile = {};
 try {
   const customerData = await getUserData({ user_uni_id: userUniId }, true);
   const customer = customerData?.get ? customerData.get({ plain: true }) : customerData;

   if (customer) {
     const customerImgPath = constants?.customer_image_path || 'uploads/customers/';
     const defaultCustomerImgPath = constants?.default_customer_image_path || 'assets/img/customer.png';
     
     customerProfile = {
       name: customer.user?.name || customer.name || '',
       email: customer.user?.email || customer.email || '',
       phone: customer.user?.phone || customer.phone || '',
       gender: customer.gender || '',
       birth_date: customer.birth_date || '',
       birth_time: customer.birth_time || '',
       birth_place: customer.birth_place || '',
       customer_img: customer.customer_img
         ? `${basePath}${customerImgPath}${customer.customer_img}`
         : `${basePath}${defaultCustomerImgPath}`
     };
   }
 } catch (err) {
   console.error('[customerDashboard] Error fetching customer profile:', err);
   customerProfile = {};
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
  customer_profile: customerProfile,
};

    return res.json({
      status: 1,
      data: dashboard,
      msg: "Dashboard data",
    });
  } catch (error) {
    console.error("customerDashboard error:", error);
    console.error("customerDashboard error stack:", error.stack);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong",
      error: error.message || 'Unknown error',
    });
  }
});

export default router;