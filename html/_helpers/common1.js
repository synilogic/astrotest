import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op, Sequelize, literal, QueryTypes,col,NOW } from "sequelize";
import User from "../_models/users.js";
import Customer from "../_models/customers.js";
import Skill from "../_models/skills.js";
import Review from "../_models/reviews.js";
import AstrologerGallery from "../_models/astrologer_galleries.js";
import Category from "../_models/categories.js";
import Astrologer from "../_models/astrologers.js";
import Language from "../_models/languages.js";

import Follower from "../_models/followers.js";
// import DiscountAssign from "../_models/astrologer_discount_assigns.js";
import AstrologerDocument from "../_models/astrologer_documents.js";
import CallHistory from "../_models/call_history.js";
import ApiKeys from "../_models/apikeys.js";
import "../_models/index.js";

import fs from "fs";
import path from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
const startingSequence = 98;
const customerstartingSequence = 200;
const filePath = path.resolve("astro-sequence.json");
const CustomerfilePath = path.resolve("customer-sequence.json");
import {
  dobFormatForApp,
  tobFormatForApp,
  getUserAssets,
} from "./dateTimeFormat.js";
import Wallet from "../_models/wallet.js";
import Vendor from "../_models/vendor.js";
import sequelize from "../_config/db.js";
import dayjs from "dayjs";
import numberShorten from "./numberShorten.js";
import { constants, ROLE_IDS } from "../_config/constants.js";
// import { checkFirebaseCustomAuthToken } from "./checkFirebaseCustomAuthToken.js";
import AstrologerPrice from "../_models/astrologer_prices.js";
import { formatDateTime } from "./dateTimeFormat.js";
import Intake from "../_models/IntakeModel.js";
import ChatChannel from "../_models/chatChannelModel.js";
import ChatChannelHistory from "../_models/chatChannelHistoryModel.js";
import moment from "moment-timezone";
import ApiKeyModel from "../_models/apikeys.js";
import { CURRENCY } from "../_config/constants.js";
import { getConfig } from "../configStore.js";
import AstrologerDiscountAssign from "../_models/astrologer_discount_assigns.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "syniastro_secret";
const API_PAGE_LIMIT = parseInt(process.env.API_PAGE_LIMIT || 20);
import UserModel from "../_models/users.js";
import CurrencyModel from "../_models/currencies.js";
import SequenceCode from "../_models/sequence_code.js";
import firebaseAdmin from "./firebase/firebase.js";
import { firebaseRealtimeDbConnection } from "./firebase/firebaseRealtimeDbConnection.js";
import { buildTokenWithUserAccount } from "./rtcTokenBuilder.js";
import { fileURLToPath } from "url";
import {
  generateVedicAstroAIKundali,
  generateVedicAstroKPKundali,
  generateVedicAstroPrashnaKundali,
  generateVedicAstroCurrentMahadashaFullKundali,
  generateVedicAstroDoshasKundali,
  generateVedicAstroBhavChalitKundali,
  generateVedicAstroWesternPlanetsKundali,
  generateVedicAstroVarshapalDetailsKundali,
} from "./generateKundali.js";
import open_ai from "./OpenAI.js";

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getCurrency = async (mobile_or_user_uni_id, type = "") => {
  // Initialize with default currency values from configuration

  let currency_code = CURRENCY.default_currency_code;
  let currency_symbol = constants.default_currency_symbol;
  let exchange_rate = constants.default_exchange_rate;

  // Query the User table to find a matching record
  const user_detail = await User.findOne({
    where: {
      [Op.or]: [
        { phone: mobile_or_user_uni_id },
        { user_uni_id: mobile_or_user_uni_id },
      ],
      trash: 0,
      status: 1,
    },
  });
  // If a user is found, attempt to get their currency details
  if (user_detail) {
    const currency_detail = await CurrencyModel.findOne({
      where: {
        country_code: user_detail.country_code,
        status: 1,
      },
    });

    if (currency_detail) {
      // Use currency details from the user's country code
      currency_code = currency_detail.currency_code;
      currency_symbol = currency_detail.currency_symbol;
      exchange_rate = currency_detail.exchange_rate;
    } else {
      // Fallback to default currency if no specific currency is found
      const default_currency_detail = await CurrencyModel.findOne({
        where: {
          default_status: 1,
          status: 1,
        },
      });

      if (default_currency_detail) {
        currency_code = default_currency_detail.currency_code;
        currency_symbol = default_currency_detail.currency_symbol;
        exchange_rate = default_currency_detail.exchange_rate;
      } else {
        // Fallback to dollar constants if no default currency exists
        currency_code = CURRENCY.dollar_currency_code;
        currency_symbol = CURRENCY.dollar_currency_symbol;
        exchange_rate = CURRENCY.dollar_exchange_rate;
      }
    }
  }

  // Determine the return value based on the type parameter
  let result;
  if (type === "all") {
    result = {
      currency_code: currency_code,
      currency_symbol: currency_symbol,
      exchange_rate: exchange_rate,
    };
  } else if (type === "symbol") {
    result = currency_symbol;
  } else if (type === "exchange_rate") {
    result = exchange_rate;
  } else {
    result = currency_code;
  }

  return result;
};

export async function validateReferralCode(referralCode = "") {
  if (referralCode && referralCode.trim() !== "") {
    const referralUser = await User.findOne({
      where: {
        user_uni_id: referralCode,
        role_id: constants.customer_role_id,
        status: 1,
        trash: 0,
      },
    });

    return !!referralUser; // true if user found, false otherwise
  }

  return false;
}
/**
 * Generate or update API key for user
 */
export async function generateUserApiKey(userId, roleId) {
  const payload = {
    user_uni_id: userId,
    role_id: roleId,
    jti: uuidv4(), // force uniqueness
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 86400 });
  const signatureOnly = token.split(".")[2]; // use 3rd part only
  const expiresAt = Math.floor(Date.now() / 1000) + 86400;

   const redirectUrl = `${req.protocol}://${req.get('host')}/api/paymentresponsephonepeapp`;

  await ApiKeys.upsert({
    user_uni_id: userId,
    api_key: signatureOnly,
    expires_at: expiresAt,
  });

  return {
    // fullToken: token,
     api_key:signatureOnly,
  };
}

/**
 * Generate a new customer_uni_id (e.g., CUS001, CUS002...)
 */

export async function normalizePhoneNumber(phone) {
   phone = phone.trim();

  // Match and separate country code (e.g. +91) from rest (10-digit)
  const match = phone.match(/^(\+\d{1,4})(\d{10})$/);

  if (match) {
    return {
      countryCode: match[1], // e.g. '+91'
      number: match[2],      // e.g. '9024100944'
    };
  }

  // If not matched, return full as number and empty code
  return {
    countryCode: '',
    number: phone,
  };
}

export function generateCustomerUniId() {
  let sequence = customerstartingSequence;
  try {
    if (fs.existsSync(CustomerfilePath)) {
      const rawData = fs.readFileSync(CustomerfilePath, "utf8");
      const data = JSON.parse(rawData);
      if (data && typeof data.sequence === "number") {
        // Force start from 98 if lower
        sequence =
          data.sequence < customerstartingSequence
            ? customerstartingSequence
            : data.sequence;
      }
    }
    const padded = String(sequence).padStart(4, "0");
    const astrologerId = `CUS${padded}`;
    // Write back incremented sequence
    fs.writeFileSync(
      CustomerfilePath,
      JSON.stringify({ sequence: sequence + 1 }),
      "utf8"
    );
    return astrologerId;
  } catch (error) {
    console.error("Error generating Customer ID:", error);
    throw error;
  }
}

export async function getUserData(filter = {}, isFirst = false) {
  console.log('insaf');
  const whereUsers = {
    trash: 0,
    status: 1,
    ...(filter.user_uni_id && { user_uni_id: filter.user_uni_id }),
    ...(filter.phone && { phone: filter.phone }),
  };

  if (filter.search) {
    whereUsers[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { phone: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  const whereCustomers = {
    ...(filter.gender && { gender: filter.gender }),
  };

  const queryOptions = {
    where: whereCustomers,
    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "phone",
          "name",
          "email",
          "country_code",
          "country_name",
          "user_fcm_token",
          "user_ios_token",
          "firebase_auth_token",
          "status",
          "user_uni_id",
        ],
        where: whereUsers,
        required: true,
      },
    ],
    order: [[{ model: User, as: "user" }, "user_uni_id", "DESC"]],
    distinct: true,
  };

  if (filter.offset && filter.offset > -1) {
    queryOptions.offset = filter.offset;
    queryOptions.limit = API_PAGE_LIMIT;
  }

  if (isFirst) {
    
    const record = await Customer.findOne(queryOptions);
    if (!record) return null;

    await enrichUserRecord(record);
    return await getUserAssets(record);
  }

  const records = await Customer.findAll(queryOptions);
  for (const record of records) {
    await enrichUserRecord(record);
    const enriched = await getUserAssets(record);
    Object.assign(record.dataValues, enriched?.dataValues || {});
  }
  
  return records;
}

export async function getVendorData(filter = {}, isFirst = false) {
  const whereUsers = {
    trash: 0,
    status: 1,
    ...(filter.user_uni_id && { user_uni_id: filter.user_uni_id }),
    ...(filter.phone && { phone: filter.phone }),
  };

  if (filter.search) {
    whereUsers[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { phone: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  const queryOptions = {
    include: [
      {
        model: User,
        as: "user", // must match Vendor.belongsTo(User, { as: 'user' })
        attributes: [
          "id",
          "phone",
          "name",
          "email",
          "country_code",
          "country_name",
          "user_fcm_token",
          "user_ios_token",
          "firebase_auth_token",
          "status",
          "user_uni_id",
        ],
        where: whereUsers,
        required: true,
      },
    ],
    order: [[{ model: User, as: "user" }, "user_uni_id", "DESC"]],
    distinct: true,
  };

  if (isFirst) {
    const record = await Vendor.findOne(queryOptions);
    console.log(record);
    return record || null;
  }

  const records = await Vendor.findAll(queryOptions);
  return records;
}

/**astrologer_uni_id
 * Enrich a user record with API key and formatted DOB/TOD
 */
async function enrichUserRecord(record) {
  const apiKey = await ApiKeys.findOne({
    where: { user_uni_id: record.customer_uni_id },
  });
  record.dataValues.user_api_key = apiKey ? apiKey.api_key : "";
  record.dataValues.birth_date = await dobFormatForApp(record.birth_date);
  record.dataValues.birth_time = await tobFormatForApp(record.birth_time);
}

export function generateAstrologerUniId() {
  let sequence = startingSequence;
  try {
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(rawData);
      if (data && typeof data.sequence === "number") {
        // Force start from 98 if lower
        sequence =
          data.sequence < startingSequence ? startingSequence : data.sequence;
      }
    }
    const padded = String(sequence).padStart(4, "0");
    const astrologerId = `ASTRO${padded}`;
    // Write back incremented sequence
    fs.writeFileSync(
      filePath,
      JSON.stringify({ sequence: sequence + 1 }),
      "utf8"
    );
    return astrologerId;
  } catch (error) {
    console.error("Error generating astrologer ID:", error);
    throw error;
  }
}


export async function getAstrologerData(filter = {}, isFirst = false,req = null) {
  try {
    // Build user-level filters
    const userWhere = {};
    if (filter.phone) {
      userWhere.phone = filter.phone;
    }
    if (filter.user_uni_id) {
      userWhere.user_uni_id = filter.user_uni_id;
    }

    // Build astrologer-level filters
    const astrologerWhere = {};
    if (filter.astrologer_uni_id) {
      astrologerWhere.astrologer_uni_id = filter.astrologer_uni_id;
    }

    const queryOptions = {
      where: astrologerWhere,
      attributes: [
        "id",
        "user_id",
        "astrologer_uni_id",
        "display_name",
        "slug",
        "house_no",
        "street_area",
        "city",
        "state",
        "country",
        "address",
        "landmark",
        "latitude",
        "longitude",
        "birth_date",
        "gender",
        "pin_code",
        "experience",
        "existing_website",
        "existing_fees",
        "associate_temple",
        "writing_experience",
        "writing_language",
        "writing_details",
        "teaching_experience",
        "teaching_subject",
        "teaching_year",
        "available_gadgets",
        "astro_img",
        "live_status",
        "video_status",
        "online_status",
        "call_status",
        "chat_status",
        // "emergency_video_status",
        // "emergency_chat_status",
        // "emergency_call_status",
        "busy_status",
       // "no_response_count",
        "admin_percentage",
        //"live_permission",
       // "slot_permission",
        "livetoken",
        "livechannel",
        "live_expire",
        "live_topic",
       // "next_request_time",
       // "astro_next_online_datetime",
        "process_status",
        "long_biography",
        "tag",
        "sort_by",
        "ask_question_price",
        "degrees",
       // "user_category_id",
        // "specialization",
        //"other_app_profile_link",
       // "is_verified",
        "is_virtual",
        "ai_astrologer_category",
        //"dummy_call_duration",
       // "dummy_chat_duration",
       // "dummy_video_duration",
       // "dummy_total_orders"
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "user_uni_id",
            "name",
            "phone",
            "email",
            //"secondary_phone",
            "updated_at",
            "avg_rating",
            "firebase_auth_token",
            "user_ios_token",
            "user_fcm_token",
            "aadhaar_no",
            "pan_no"
          ],
          required: true,
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        },
        {
          model: Category,
          as: "categories",
          attributes: ["id", "category_title"],
          through: { attributes: [] },
        },
         {
          model: ApiKeys,
          as: 'api_keys',
          attributes: ['api_key'],
          required: false
        },
        {
          model: Skill,
          as: "skills",
          attributes: ["id", "skill_name"],
        },
        {
          model: Review,
          as: "reviews",
          attributes: ["id", "review_rating"],
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "customer_uni_id"],
            },
          ],
        },
        {
          model: AstrologerPrice,
          as: "prices",
          attributes: ["id", "price"],
          where: { trash: 0 },
          required: false
        },
         {
            model: Language,
            as: 'languages', // match the alias used in association
            attributes: ['id', 'language_name'], // adjust fields as needed
            through: { attributes: [] } // skip pivot table fields
          },
      ],
      limit: isFirst ? 1 : undefined,
      distinct: true,
      logging: console.log
    };

    const result = await Astrologer.findAll(queryOptions);
   // console.log("Fetched astrologer data:", result);

    // Format the response
    const formattedResult = result.map(astrologer => {
      const astrologerData = astrologer.get({ plain: true });

     const DEFAULT_IMG = `${req.protocol}://${req.get("host")}/assets/img/astrologer.jpg`;
      const BASE_IMG_URL = `${req.protocol}://${req.get("host")}/uploads/astrologer/icon/`;

      astrologerData.astro_img = astrologerData.astro_img
        ? `${BASE_IMG_URL}${astrologerData.astro_img}`
        : DEFAULT_IMG;
      
     // astrologerData.astro_img_secondary = astrologerData.astro_img_secondary || DEFAULT_ASTRO_IMG;
      astrologerData.user.full_info = `() {${astrologerData.user.phone}} [${astrologerData.astrologer_uni_id}] [${astrologerData.status || 'InActive'}]`;
      // Ensure user object is included
      astrologerData.user = astrologerData.user || {};

      // Set default values for other fields
     // astrologerData.categories = astrologerData.categories || [];
     // astrologerData.skills = astrologerData.skills || [];
      astrologerData.reviews = astrologerData.reviews || [];
      astrologerData.prices = astrologerData.prices || [];
     // astrologerData.aadhaar_card_no = astrologerData.aadhaar_card_no || "";
      astrologerData.total_call_duration = astrologerData.total_call_duration || "0";
      astrologerData.total_chat_duration = astrologerData.total_chat_duration || "0";
      astrologerData.total_video_duration = astrologerData.total_video_duration || "0";
      astrologerData.review_count = astrologerData.review_count || 0;
      astrologerData.total_waiting_time = astrologerData.total_waiting_time || 0;
      astrologerData.total_queue_count = astrologerData.total_queue_count || 0;
      astrologerData.follower_count = astrologerData.follower_count || 0;
      astrologerData.total_call = astrologerData.total_call || "0";
      astrologerData.total_orders_count = astrologerData.total_orders_count || "0";
      astrologerData.follower_count_new = astrologerData.follower_count_new || "0";
      astrologerData.category_names = astrologerData.categories?.map(cat => cat.category_title).join(', ') || '';
      astrologerData.skill_names = astrologerData.skills?.map(skill => skill.skill_name).join(', ') || '';
      astrologerData.language_name = astrologerData.languages?.map(lang => lang.language_name).join(', ') || '';
      astrologerData.home_sort_by = astrologerData.home_sort_by || "";
     // astrologerData.home_sort_start_date = astrologerData.home_sort_start_date || "";
     // astrologerData.home_sort_end_date = astrologerData.home_sort_end_date || "";
        astrologerData.is_architect = astrologerData.is_architect || 0;
      astrologerData.is_electro_homoeopathy = astrologerData.is_electro_homoeopathy || 0;
   //   astrologerData.location = astrologerData.location || "";
      astrologerData.firebase_auth_token = astrologerData.firebase_auth_token || "";
      astrologerData.upcoming_live = astrologerData.upcoming_live || "";
      //astrologerData.user_category = astrologerData.user_category || "";
      astrologerData.service_assigns = astrologerData.service_assigns || [];
      astrologerData.blogs = astrologerData.blogs || [];
      astrologerData.document_image_list = astrologerData.document_image_list || [];
      astrologerData.upcoming_live_time = astrologerData.upcoming_live_time || [];
      // astrologerData.user_api_key = astrologerData.user_api_key || "";
      astrologerData.user_api_key = astrologerData.api_keys.api_key || '';
      astrologerData.currency_code = "INR";
      astrologerData.currency_symbol = "₹";
      delete astrologerData.languages;
      delete astrologerData.skills;
      delete astrologerData.categories;
      delete astrologerData.api_keys;
      return astrologerData;
    });

    return formattedResult;
  } catch (error) {
    console.error("Error fetching astrologer data:", error);
    return [];
  }
}

////function in constructions..
export async function getAstroData(filter = {}, isFirst = false) {
  const currency = "INR";
  filter.currency = currency;

  // Get the base query
  const thisModel = await getQuery(filter, isFirst);

  let astrologers = [];

  if (isFirst) {
    // Get the first record
    const astrologer = await thisModel.findOne();
    if (astrologer) {
      astrologers = await getAstrologerAssets(astrologer, filter);
    }
  } else {
    // Get all records
    astrologers = await thisModel.findAll();

    // Shuffle the astrologers list if needed
    if (astrologers.length > 0) {
      astrologers = astrologerListShuffle(astrologers);
      for (let i = 0; i < astrologers.length; i++) {
        astrologers[i] = await getAstrologerAssets(astrologers[i], filter);
      }
    }
  }

  return astrologers;
}

// Helper function to shuffle the astrologers list
function astrologerListShuffle(astrologers) {
  for (let i = astrologers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [astrologers[i], astrologers[j]] = [astrologers[j], astrologers[i]];
  }
  return astrologers;
}

export async function checkUserApiKey(user_api_key, user_uni_id) {
  try {
    const count = await ApiKeyModel.count({
      where: {
        api_key: user_api_key,
        user_uni_id: user_uni_id,
      },
    });

    return count > 0;
  } catch (error) {
    console.error("Error checking API key:", error);
    return false;
  }
}

export const UploadImage = async (req, uploadPath, fieldName) => {
  const imageData = req.body[fieldName];

  if (!imageData) throw new Error("No image provided");

  const filename = `${uuidv4()}.jpg`;
  const fullPath = path.join(uploadPath, filename);

  // Case 1: Direct URL
  if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
    const response = await axios.get(imageData, { responseType: "stream" });
    const writer = fs.createWriteStream(fullPath);
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on("finish", () => resolve(filename));
      writer.on("error", reject);
    });
  }

  // Case 2: Base64 encoded image
  const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 image format");

  const ext = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, "base64");
  const imageFilename = `${uuidv4()}.${ext}`;
  const imagePath = path.join(uploadPath, imageFilename);
  fs.writeFileSync(imagePath, buffer);
  return imageFilename;
};


async function getQuery(filterArray, isFirst = 0) {
  const limit = Number(filterArray.limit || process.env.API_PAGE_LIMIT || 10);
  const offset = Number(filterArray.offset || 0);
  const currentDatetime = dayjs().format("YYYY-MM-DD HH:mm:ss");

  const where = {};
  const include = [
    {
      model: User,
      as: "user",
      where: { trash: 0 },
      required: true,
    },
  ];
  const order = [];

  // ========== FILTERS ==========

  if (filterArray.gender) where.gender = filterArray.gender;
  if (filterArray.astrologer_uni_id)
    where.astrologer_uni_id = filterArray.astrologer_uni_id;
  if (filterArray.slug) where.slug = filterArray.slug;
  if (filterArray.tag) where.tag = filterArray.tag;
  if (filterArray.slot_permission !== undefined)
    where.slot_permission = filterArray.slot_permission;
  if (filterArray.is_virtual !== undefined)
    where.is_virtual = filterArray.is_virtual;
  if (filterArray.online_status !== undefined)
    where.online_status = filterArray.online_status;

  const userWhere = include[0].where;
  if (filterArray.rating) userWhere.avg_rating = filterArray.rating;
  if (filterArray.phone) userWhere.phone = filterArray.phone;
  if (filterArray.status !== undefined) userWhere.status = filterArray.status;

  if (filterArray.search) {
    const search = filterArray.search.trim();
    userWhere[Op.or] = [
      { phone: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
    ];
    include.push({
      model: Skill,
      as: "skills",
      where: { skill_name: { [Op.like]: `%${search}%` } },
      required: false,
    });
  }

  if (filterArray.category) {
    const categories = Array.isArray(filterArray.category)
      ? filterArray.category
      : filterArray.category.replace(/\[|\]|\s/g, "").split(",");
    include.push({
      model: Category,
      as: "categories",
      where: { id: { [Op.in]: categories } },
      through: { attributes: [] },
      required: true,
    });
  } else if (isFirst !== 1) {
    const excluded = [
      process.env.ARCHITECT_CATEGORY_ID,
      ...(process.env.ELECTRO_HOMEOPATHY_CATEGORY_ID
        ? [process.env.ELECTRO_HOMEOPATHY_CATEGORY_ID]
        : []),
    ];
    include.push({
      model: Category,
      as: "categories",
      where: { id: { [Op.notIn]: excluded } },
      through: { attributes: [] },
      required: false,
    });
  }

  if (filterArray.language) {
    const languages = Array.isArray(filterArray.language)
      ? filterArray.language
      : filterArray.language.replace(/\[|\]|\s/g, "").split(",");
    include.push({
      model: Language,
      as: "languages",
      where: { id: { [Op.in]: languages } },
      through: { attributes: [] },
      required: true,
    });
  }

  if (filterArray.skill) {
    const skills = Array.isArray(filterArray.skill)
      ? filterArray.skill
      : filterArray.skill.replace(/\[|\]|\s/g, "").split(",");
    include.push({
      model: Skill,
      as: "skills",
      where: { id: { [Op.in]: skills } },
      through: { attributes: [] },
      required: true,
    });
  }

  if (filterArray.following_id) {
    include.push({
      model: Follower,
      as: "followers",
      where: { user_uni_id: filterArray.following_id },
      required: true,
    });
  }

  // ========== ORDERING ==========

  order.push([
    Sequelize.literal(`(
              SELECT discount_percent FROM astrologer_discount_assigns
              WHERE start_from <= '${currentDatetime}'
              AND end_at >= '${currentDatetime}'
              AND status = 1
              AND astrologer_uni_id = astrologers.astrologer_uni_id
              AND astrologers.online_status = 1
              LIMIT 1
          )`),
    "DESC",
  ]);

  switch (filterArray.sortby) {
    case "latest":
      order.push([{ model: User, as: "user" }, "created_at", "DESC"]);
      break;
    case "rating":
      order.push([{ model: User, as: "user" }, "avg_rating", "DESC"]);
      break;
    case "price-desc":
    case "price-asc":
      include.push({ model: Price, as: "price", required: false });
      order.push([
        { model: Price, as: "price" },
        "price",
        filterArray.sortby === "price-desc" ? "DESC" : "ASC",
      ]);
      break;
    case "experience-asc":
    case "experience-desc":
      order.push([
        "experience",
        filterArray.sortby === "experience-asc" ? "ASC" : "DESC",
      ]);
      break;
    case "free-offer":
      order.push([
        Sequelize.literal(`(
                      SELECT COUNT(*) FROM call_history
                      WHERE astrologer_uni_id = astrologers.astrologer_uni_id
                      AND offer_type IN (2, 3)
                      AND status = 'completed'
                  )`),
        "DESC",
      ]);
      break;
    case "trending":
      order.push([
        Sequelize.literal(`(
                      SELECT COUNT(*) FROM call_history
                      WHERE astrologer_uni_id = astrologers.astrologer_uni_id
                      AND status = 'completed'
                  )`),
        "DESC",
      ]);
      break;
    default:
      if (isFirst !== 2) {
        order.push([
          Sequelize.literal(`CASE
                          WHEN online_status = 1 AND (call_status = 1 OR chat_status = 1 OR video_status = 1) THEN sort_by
                          ELSE NULL
                      END`),
          "DESC",
        ]);
        order.push([
          Sequelize.literal(`CASE
                          WHEN online_status = 1 AND busy_status = 0 AND call_status = 1 AND chat_status = 1 AND video_status = 1 THEN 1
                          WHEN online_status = 1 AND busy_status = 0 AND call_status = 1 AND chat_status = 1 AND video_status = 0 THEN 2
                          WHEN online_status = 1 AND busy_status = 0 AND call_status = 1 AND chat_status = 0 AND video_status = 1 THEN 3
                          WHEN online_status = 1 AND busy_status = 0 AND call_status = 1 AND chat_status = 0 AND video_status = 0 THEN 4
                          WHEN online_status = 1 AND busy_status = 0 AND call_status = 0 AND chat_status = 1 AND video_status = 1 THEN 5
                          WHEN online_status = 1 AND busy_status = 0 AND call_status = 0 AND chat_status = 1 AND video_status = 0 THEN 6
                          WHEN online_status = 1 AND busy_status = 0 AND call_status = 0 AND chat_status = 0 AND video_status = 1 THEN 7
                          WHEN online_status = 1 AND busy_status = 0 AND call_status = 0 AND chat_status = 0 AND video_status = 0 THEN 8
                          WHEN online_status = 1 AND busy_status = 1 AND call_status = 1 AND chat_status = 1 AND video_status = 1 THEN 9
                          WHEN online_status = 1 AND busy_status = 1 AND call_status = 1 AND chat_status = 1 AND video_status = 0 THEN 10
                          WHEN online_status = 1 AND busy_status = 1 AND call_status = 1 AND chat_status = 0 AND video_status = 1 THEN 11
                          WHEN online_status = 1 AND busy_status = 1 AND call_status = 1 AND chat_status = 0 AND video_status = 0 THEN 12
                          WHEN online_status = 1 AND busy_status = 1 AND call_status = 0 AND chat_status = 1 AND video_status = 1 THEN 13
                          WHEN online_status = 1 AND busy_status = 1 AND call_status = 0 AND chat_status = 1 AND video_status = 0 THEN 14
                          WHEN online_status = 1 AND busy_status = 1 AND call_status = 0 AND chat_status = 0 AND video_status = 1 THEN 15
                          WHEN online_status = 1 AND busy_status = 1 AND call_status = 0 AND chat_status = 0 AND video_status = 0 THEN 16
                          WHEN online_status = 0 AND busy_status = 1 AND call_status = 0 AND chat_status = 0 AND video_status = 0 THEN 17
                          ELSE 18
                      END`),
          "ASC",
        ]);
        order.push([
          Sequelize.literal(`(
                          SELECT IFNULL(SUM(waiting_time), 0)
                          FROM call_history
                          WHERE astrologer_uni_id = astrologers.astrologer_uni_id
                          AND status IN ('queue', 'queue_request', 'request', 'in-progress')
                      )`),
          "ASC",
        ]);
        order.push([{ model: User, as: "user" }, "avg_rating", "DESC"]);
      }
      break;
  }
  ``;

  if (offset === 0) {
    order.push([Sequelize.fn("RAND")]);
  }

  return await Astrologer.findAll({ where, include, order, limit, offset });
}

export function getAstrologerAssets(astrologer, filterArray = {}) {
  const totalCall =
    parseInt(astrologer.total_chat_duration || 0) +
    parseInt(astrologer.total_call_duration || 0) +
    parseInt(astrologer.total_video_duration || 0);

  astrologer.total_call = totalCall > 0 ? numberShorten(totalCall / 60, 0) : 0;
  astrologer.total_chat_duration = astrologer.total_chat_duration
    ? numberShorten(astrologer.total_chat_duration / 60, 0).toString()
    : "0";
  astrologer.total_call_duration = astrologer.total_call_duration
    ? numberShorten(astrologer.total_call_duration / 60, 0).toString()
    : "0";
  astrologer.total_video_duration = astrologer.total_video_duration
    ? numberShorten(astrologer.total_video_duration / 60, 0).toString()
    : "0";

  astrologer.total_waiting_time = parseInt(astrologer.total_waiting_time || 0);
  astrologer.total_queue_count = parseInt(astrologer.total_queue_count || 0);

  astrologer.category_names =
    astrologer.categories?.map((c) => c.category_title).join(", ") || "";
  astrologer.skill_names =
    astrologer.skills?.map((s) => s.skill_name).join(", ") || "";
  astrologer.language_name =
    astrologer.languages?.map((l) => l.language_name).join(", ") || "";

  const limit = filterArray.limit || undefined;

  astrologer.reviews = Array.isArray(astrologer.reviews)
    ? astrologer.reviews.slice(0, limit)
    : [];

  astrologer.service_assigns = Array.isArray(astrologer.service_assigns)
    ? astrologer.service_assigns.slice(0, limit)
    : [];

  // astrologer.blogs = Array.isArray(astrologer.blogs)
  //   ? astrologer.blogs.slice(0, limit)
  //   : [];

  astrologer.is_architect =
    astrologer.categories?.some(
      (c) => c.id === constants.architect_category_id
    ) && !constants.architect_category_id
      ? 1
      : 0;

  astrologer.is_electro_homoeopathy =
    astrologer.categories?.some(
      (c) => c.id === constants.electro_homoeopathy_category_id
    ) && !!constants.electro_homoeopathy_category_id
      ? 1
      : 0;

  delete astrologer.categories;
  delete astrologer.skills;
  delete astrologer.languages;

  astrologer.upcoming_live_time = astrologer.upcoming_live || [];
  delete astrologer.upcoming_live;

  const documentImageList = {};

  if (Array.isArray(astrologer.document_images)) {
    astrologer.document_images.forEach((doc) => {
      if (doc.document_type === "Aadhaar Card") {
        documentImageList.aadhaar_card_front = doc.front;
        documentImageList.aadhaar_card_back = doc.back;
      }
      if (doc.document_type === "Pan Card") {
        documentImageList.pan_card_front = doc.front;
        documentImageList.pan_card_back = doc.back;
      }
    });
  }
  astrologer.document_image_list = documentImageList;
  delete astrologer.document_images;
  return astrologer;
}

function ImageShow(imgPath, img, type = "", defaultImg = "") {
  // Return default image if any required parameter is null/undefined
  if (!imgPath || !img) {
    return defaultImg
      ? `${constants.base_url}/${defaultImg}`
      : `${constants.base_url}/${constants.default_image_path}`;
  }

  const originalImgPath = path.join(process.cwd(), "public", imgPath, img);
  const originalImgUrl = `${constants.base_url}/${imgPath}/${img}`;

  let url, filePath, imgUrl;

  if (type) {
    url = `${constants.base_url}/${imgPath}${type}/`;
    filePath = path.join(process.cwd(), "public", imgPath, type);
    imgUrl = `${url}/${img}`;
  } else {
    url = `${constants.base_url}/${imgPath}`;
    filePath = path.join(process.cwd(), "public", imgPath);
    imgUrl = `${url}/${img}`;
  }

  let defaultimg;
  if (defaultImg) {
    defaultimg = `${constants.base_url}/${defaultImg}`;
  } else {
    defaultimg = `${constants.base_url}/${constants.default_image_path}`;
  }

  try {
    const publicpath = path.join(filePath, img);
    let imagUrl;

    if (fs.existsSync(publicpath)) {
      imagUrl = imgUrl;
    } else if (fs.existsSync(originalImgPath)) {
      imagUrl = originalImgUrl;
    } else {
      imagUrl = defaultimg;
    }

    return imagUrl;
  } catch (error) {
    console.error("Error in ImageShow:", error);
    return defaultimg;
  }
}

export const getCustomerQueueList = async (user_uni_id) => {
  // Get current date and time in MySQL-compatible format
  const currentDateTime = formatDateTime(new Date());

  // Initial query to fetch call history records with astrologer details
  const res = await CallHistory.findAll({
    attributes: [
      "uniqeid",
      "order_date",
      "call_type",
      "status",
      [literal("astrologer.display_name"), "display_name"],
      [literal("astrologer.astrologer_uni_id"), "astrologer_uni_id"],
      [literal("astrologer.astro_img"), "astro_img"],
      [
        sequelize.fn("SUM", sequelize.col("waiting_time")),
        "total_waiting_time",
      ],
      [sequelize.fn("COUNT", sequelize.col("uniqeid")), "total_queue_count"],
    ],
    include: [
      {
        model: Astrologer,
        as: "astrologer",
        attributes: [],
      },
    ],
    where: {
      customer_uni_id: user_uni_id,
      status: { [Op.in]: ["queue", "queue_request", "request", "in-progress"] },
    },
    group: [
      "call_history.uniqeid",
      "call_history.order_date",
      "call_history.call_type",
      "call_history.status",
      "astrologer.astrologer_uni_id",
      "astrologer.display_name",
      "astrologer.astro_img",
    ],
    order: [["order_date", "ASC"]], // Changed from id to order_date
    raw: true,
  });
  // Process each record to calculate queue position and waiting times
  for (const value of res) {
    const [sequence] = await sequelize.query(
      `
      SELECT * FROM (
        SELECT @rownum := @rownum + 1 AS my_queue_number,
               @waiting_time := @waiting_time + chn.waiting_time AS my_waiting_time,
               chn.waiting_time,
               chn.uniqeid,
               IF(chn.status = 'in-progress', TIMESTAMPDIFF(SECOND, chn.call_start, :currentDateTime), 0) AS in_progress_waiting,
               chn.customer_uni_id,
               chn.astrologer_uni_id
        FROM call_history chn
        CROSS JOIN (SELECT @rownum := 0, @waiting_time := 0) r
        WHERE chn.astrologer_uni_id = :astrologer_uni_id
          AND chn.status IN ('queue', 'queue_request', 'request', 'in-progress')
        ORDER BY chn.created_at ASC
      ) a
      WHERE a.customer_uni_id = :customer_uni_id
        AND a.uniqeid = :uniqeid
    `,
      {
        replacements: {
          astrologer_uni_id: value.astrologer_uni_id,
          customer_uni_id: user_uni_id,
          uniqeid: value.uniqeid,
          currentDateTime: currentDateTime,
        },
        type: QueryTypes.SELECT,
      }
    );

    // Assign queue position and waiting times, defaulting to 0 if not found
    value.my_queue_number = sequence ? sequence.my_queue_number : 0;
    value.my_waiting_time = sequence ? sequence.my_waiting_time : 0;
    value.in_progress_waiting = sequence ? sequence.in_progress_waiting : 0;

    // Process astrologer image
    const imgPath = constants.astrologer_image_path;
    const imgDefaultPath = constants.default_astrologer_image_path;
    value.astro_img = ImageShow(
      imgPath,
      value.astro_img,
      "icon",
      imgDefaultPath
    );
  }

  return res;
};

export const getCustomerById = async (cus_id) => {
  const result = await Customer.findOne({
    where: { customer_uni_id: cus_id },
    include: [
      {
        model: User,
        as: "user",
        foreignKey: "user_uni_id",
      },
    ],
  });

  return result;
};

// const getCurrency = (mobile) => {
//   let currency_code = "INR";

//   const countryCallingCode = constants.country_calling_code || "+91";

//   if (!mobile.includes(countryCallingCode)) {
//     currency_code = "USD";
//   }
//   return currency_code;
// };

export const alreadySentRequestUniqeid = async (
  customer_uni_id = "",
  astrologer_uni_id = ""
) => {
  let uniqeid = "";
  if (customer_uni_id && astrologer_uni_id) {
    const checkAlreadyCallOrder = await CallHistory.findAll({
      where: {
        customer_uni_id: customer_uni_id,
        astrologer_uni_id: astrologer_uni_id,
        status: {
          [Op.or]: ["queue", "queue_request", "request", "in-progress"],
        },
      },
    });
    if (checkAlreadyCallOrder.length > 0) {
      uniqeid = checkAlreadyCallOrder[0].uniqeid;
    }
  } else if (customer_uni_id) {
    const checkAlreadyCallOrder = await CallHistory.findAll({
      where: {
        customer_uni_id: customer_uni_id,
        status: {
          [Op.or]: ["queue", "queue_request", "request", "in-progress"],
        },
      },
    });

    if (checkAlreadyCallOrder.length > 0) {
      uniqeid = checkAlreadyCallOrder[0].uniqeid;
    }
  }
  return uniqeid;
};

export const getAstroDiscount = async (astrologer_uni_id = "", type = "") => {
  try {
    let result = null;
    const is_type_based = 0;
    let is_type_checked = 1;
    const astrologer_discount_on = getConfig("astrologer_discount_on");

    if (is_type_based === 1) {
      is_type_checked = 0;
      if (type && astrologer_discount_on.includes(type)) {
        is_type_checked = 1;
      }
    }

    if (astrologer_uni_id && is_type_checked === 1) {
      const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

      let whereClause = {
        astrologer_uni_id,
        start_from: { [Op.lte]: now },
        end_at: { [Op.gte]: now },
        status: 1,
      };

      if (is_type_based === 1) {
        if (type === "call") whereClause.call_status = 1;
        if (type === "chat") whereClause.chat_status = 1;
        if (type === "video") whereClause.video_status = 1;
      }

      const discount = await AstrologerDiscountAssign.findOne({
        where: whereClause,
      });

      if (discount) {
        discount.offer_type = 4;
        result = discount;
      }
    }

    return result;
  } catch (error) {
    console.error("Error in getAstroDiscount:", error);
    return null;
  }
};

export const getAstroDiscountedPrice = async (
  astrologer_uni_id = "",
  price = 0,
  discount_percent = 0
) => {
  let discounted_price = price;

  if (
    typeof discount_percent === "number" &&
    discount_percent > 0 &&
    typeof price === "number" &&
    price > 0
  ) {
    if (discount_percent >= 100) {
      discounted_price = 0;
    } else {
      discounted_price =
        price - Math.round(((discount_percent * price) / 100) * 100) / 100;
    }
  }

  return discounted_price;
};

export const getAstroPriceDataType = async (
  astrologer_id,
  type,
  currency = "INR",
  customer_uni_id = ""
) => {
  try {
    // Ensure currency is resolved if it's a Promise
    const resolvedCurrency = await Promise.resolve(currency);

    // Ensure all parameters are properly awaited and resolved
    const result = await AstrologerPrice.findOne({
      where: {
        astrologer_uni_id: astrologer_id,
        type: type,
        currency: resolvedCurrency,
        trash: 0,
      },
    });

    if (!result) return null;

    let is_offer_applied = 0;
    let other_offer_type = 0;

    // First call offer
    const firstCallOffer = await getConfig("first_call_offer");

    try {
      const dualOffer = await checkAstroOfferAfterLimitExceed(astrologer_id);
      if (dualOffer && !isNaN(dualOffer) && Number(dualOffer) > 0) {
        firstCallOffer = dualOffer;
      }
    } catch (error) {
      console.error("Error checking dual offer limit:", error);
    }

    if (String(firstCallOffer) === "2" && customer_uni_id) {
      try {
        const firstCallPrice = await getConfig("first_call_price_per_min");
        if (firstCallPrice && Number(firstCallPrice) > 0) {
          const isFirstCall = await isFirstUser(customer_uni_id, astrologer_id);
          if (!isFirstCall) {
            const callType = result.type;
            const lowOfferTypes = lowPriceOfferOn();
            if (lowOfferTypes.includes(callType)) {
              result.price = firstCallPrice;
              is_offer_applied = 1;
            }
          }
        }
      } catch (error) {
        console.error("Error applying first call offer:", error);
      }
    }

    // Apply astrologer discount if no offer applied
    if (!is_offer_applied) {
      try {
        const astroDiscount = await getAstroDiscount(astrologer_id);
        if (astroDiscount) {
          result.price = await getAstroDiscountedPrice(
            astrologer_id,
            result.price,
            astroDiscount.discount_percent
          );
          other_offer_type = astroDiscount.offer_type;
        }
      } catch (error) {
        console.error("Error applying astrologer discount:", error);
      }
    }

    result.other_offer_type = other_offer_type;
    return result;
  } catch (error) {
    console.error("Error in getAstroPriceDataType:", error);
    throw new Error("Unable to fetch astrologer pricing data.");
  }
};

export const checkAstroOfferAfterLimitExceed = async (
  astrologer_uni_id = ""
) => {
  try {
    let second_offer = "";

    if (!astrologer_uni_id) return second_offer;

    const afterLimitOfferEnabled = getConfig(
      "after_limit_exceed_apply_low_price_offer"
    );
    const firstCallOffer = getConfig("first_call_offer");
    const offerTypeToCheck = 3;
    const limit = getConfig("limit_for_each_astrologer");

    if (
      String(firstCallOffer) === String(offerTypeToCheck) &&
      Number(afterLimitOfferEnabled) === 1 &&
      Number(limit) > 0
    ) {
      const fromDate = dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss");
      const toDate = dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss");

      const count = await CallHistory.count({
        where: {
          astrologer_uni_id: astrologer_uni_id,
          status: "completed",
          offer_type: offerTypeToCheck,
          created_at: {
            $between: [fromDate, toDate], // Sequelize v6+ uses Op.between
          },
        },
      });

      if (Number(count) >= Number(limit)) {
        second_offer = 2;
      }
    }

    return second_offer;
  } catch (error) {
    console.error("Error in checkAstroOfferAfterLimitExceed:", error);
    return "";
  }
};
export async function checkAstroOfferCallLimitAllow(astrologer_uni_id = "") {
  let status = true;

  if (astrologer_uni_id) {
    const limit_for_each_astrologer = getConfig("limit_for_each_astrologer");

    const isFixedAmount =
      getConfig("fixed_amount_to_astrologer_after_limit_exceed") == 1;
    const isNoLimit = getConfig("no_limit_for_fixed_amount_to_astrologer") == 1;

    if (
      limit_for_each_astrologer &&
      !isNaN(limit_for_each_astrologer) &&
      limit_for_each_astrologer > 0 &&
      isNoLimit !== true
    ) {
      // Set timezone, for example 'Asia/Kolkata'
      const currentDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
      const from_date = `${currentDate} 00:00:00`;
      const to_date = `${currentDate} 23:59:59`;

      let astroCallHistoryCount = 0;

      if (isFixedAmount) {
        astroCallHistoryCount = await CallHistory.count({
          where: {
            astrologer_uni_id,
            status: "completed",
            offer_type: 3,
            created_at: {
              [Op.between]: [from_date, to_date],
            },
          },
        });

        if (
          !isNaN(astroCallHistoryCount) &&
          astroCallHistoryCount > limit_for_each_astrologer
        ) {
          status = false;
        }
      } else {
        astroCallHistoryCount = await CallHistory.count({
          where: {
            astrologer_uni_id,
            offer_type: 3,
            status: {
              [Op.in]: [
                "queue",
                "queue_request",
                "request",
                "in-progress",
                "completed",
              ],
            },
            created_at: {
              [Op.between]: [from_date, to_date],
            },
          },
        });

        if (
          !isNaN(astroCallHistoryCount) &&
          astroCallHistoryCount >= limit_for_each_astrologer
        ) {
          status = false;
        }
      }
    } else {
      if (isFixedAmount && isNoLimit) {
        status = false;
      }
    }
  }

  return status;
}
// export const isFirstUser = async (user_uni_id) => {
//   if (!user_uni_id) return null;

//   //  Find the base customer by user_uni_id and customer role
//   const customerDetail = await User.findOne({
//     where: {
//       user_uni_id,
//       role_id: ROLE_IDS.USER
//     }
//   });

//   if (!customerDetail) return null;

//   //Find all users with the same phone and customer role
//   const customersByPhone = await User.findAll({
//     where: {
//       phone: customerDetail.phone,
//       role_id: ROLE_IDS.USER
//     }
//   });

//   if (!customersByPhone || customersByPhone.length === 0) return null;

//   // Check each customer for completed call history
//   for (const customer of customersByPhone) {
//     const callHistory = await CallHistory.findOne({
//       where: {
//         customer_uni_id: customer.user_uni_id,
//         status: "completed"
//       }
//     });

//     if (callHistory) return callHistory;
//   }

//   return null;
// };

export const isFirstUser = async (user_uni_id, astrologer_uni_id = "") => {
  let callHistory = null;
  let customerCountryCode = constants.default_country_code;

  const customerDetail = await User.findOne({
    where: {
      user_uni_id,
      role_id: ROLE_IDS.USER,
    },
  });

  if (customerDetail) {
    const customerListByPhone = await User.findAll({
      where: {
        phone: customerDetail.phone,
        role_id: ROLE_IDS.USER,
      },
    });

    customerCountryCode =
      customerDetail.country_code || constants.default_country_code;

    for (const customer of customerListByPhone) {
      callHistory = await CallHistory.findOne({
        where: {
          customer_uni_id: customer.user_uni_id,
          status: "completed",
        },
      });
      if (callHistory) break;
    }
  }

  if (astrologer_uni_id) {
    const checkAstroDetails = await Astrologer.findOne({
      where: { astrologer_uni_id },
    });

    if (checkAstroDetails) {
      // Custom logic: is_electro
      if (
        checkAstroDetails.is_electro &&
        getConfig("offer_enable_for_electro_homoeopathys") !== 1
      ) {
        callHistory = true;
      } else {
        if (getConfig("fixed_amount_to_astrologer_after_limit_exceed") !== 1) {
          // Optionally implement: checkAstroOfferCallLimitAllow(astrologer_uni_id)
          // if (!checkAstroOfferCallLimitAllow(astrologer_uni_id)) {
          //   callHistory = true;
          // }
        }
      }

      if (getConfig("exclude_vip_tagged_astrologers_from_offers") == 1) {
        if (String(checkAstroDetails.tag).toLowerCase() === "vip") {
          callHistory = true;
        }
      }

      if (getConfig("allow_offer_to_ai_astrologers_only") == 1) {
        if (String(checkAstroDetails.is_virtual) !== "1") {
          callHistory = true;
        }
      }
    }
  }

  if (!callHistory) {
    let checkAstroFlag = 0;

    if (astrologer_uni_id) {
      const astroDetail = await User.findOne({
        where: {
          user_uni_id: astrologer_uni_id,
          role_id: ROLE_IDS.ASTROLOGER,
        },
      });

      if (
        astroDetail &&
        astroDetail.country_code !== constants.default_country_code
      ) {
        checkAstroFlag = 1;
      }
    }

    let firstCallOffer = getConfig("first_call_offer");

    // Dual Offer Logic
    const dualOffer = await checkAstroOfferAfterLimitExceed(astrologer_uni_id);
    if (dualOffer && !isNaN(dualOffer) && Number(dualOffer) > 0) {
      firstCallOffer = dualOffer;
    }

    if (
      firstCallOffer == 2 &&
      (customerCountryCode !== constants.default_country_code ||
        checkAstroFlag === 1)
    ) {
      callHistory = true;
    }
  }

  return callHistory;
};
export function lowPriceOfferOn() {
  const result = [];

  if (constants.low_price_offer_on_voice_call === 1) {
    result.push("call");
  }

  if (constants.low_price_offer_on_chat === 1) {
    result.push("chat");
  }

  if (constants.low_price_offer_on_video_call === 1) {
    result.push("video");
  }

  return result;
}

export function freeMinutesOfferOn() {
  const result = [];

  if (constants.free_minutes_offer_on_voice_call === 1) {
    result.push("call");
  }

  if (constants.free_minutes_offer_on_chat === 1) {
    result.push("chat");
  }

  if (constants.free_minutes_offer_on_video_call === 1) {
    result.push("video");
  }

  return result;
}

export async function getTotalBalanceById(uni_id) {
  try {
    const totalCr = await Wallet.sum("amount", {
      where: {
        user_uni_id: uni_id,
        main_type: "cr",
        status: 1,
      },
    });
    const totalDr = await Wallet.sum("amount", {
      where: {
        user_uni_id: uni_id,
        main_type: "dr",
        status: 1,
      },
    });

    const total = parseFloat(totalCr || 0) - parseFloat(totalDr || 0);

    return Math.round(total * 100) / 100;
  } catch (err) {
    console.error("Error fetching total balance:", err);
    return 0;
  }
}

export const checkFirebaseCustomAuthToken = async (user_uni_id = "") => {
  let token = "";
  if (user_uni_id) {
    const userDetails = await User.findOne({
      where: { user_uni_id },
      attributes: ["firebase_auth_token"],
    });
    if (
      userDetails &&
      userDetails.dataValues.firebase_auth_token &&
      userDetails.dataValues.firebase_auth_token !== null
    ) {
      token = userDetails.dataValues.firebase_auth_token;
    }
  }

  return token;
};

export async function remainingChatTime(uniqeid = "") {
  const result = {};
  let remaining_time_in_second = 0;
  let minutes = 0;
  let call_status = "";

  // Fetch call history from the database
  const callHistory = await CallHistory.findOne({
    where: {
      uniqeid: uniqeid,
      status: {
        [Op.or]: ["queue", "queue_request", "request", "in-progress"],
      },
    },
    include: [
      {
        model: UserModel,
        as: "customer_user",
        attributes: ["name"],
      },
      {
        model: Astrologer,
        as: "astrologer",
        attributes: ["display_name"],
      },
    ],
  });

  if (callHistory) {
    call_status = callHistory.status;

    // Handle chat type
    if (
      callHistory.call_type === "chat" &&
      (call_status === "in-progress" || call_status === "request")
    ) {
      if (call_status === "in-progress") {
        const current_time = Math.floor(Date.now() / 1000);
        const chat_start_time = Math.floor(
          new Date(callHistory.call_start).getTime() / 1000
        );

        const time_difference = current_time - chat_start_time;
        const total_time_in_second = callHistory.waiting_time;
        remaining_time_in_second = total_time_in_second - time_difference;
      } else {
        remaining_time_in_second = callHistory.waiting_time;
      }
      if (remaining_time_in_second > 0) {
        minutes = Math.round((remaining_time_in_second / 60) * 100) / 100;
      } else {
        remaining_time_in_second = 0;
      }
    }
    // Handle video type
    else if (
      callHistory.call_type === "video" &&
      (call_status === "in-progress" || call_status === "request")
    ) {
      if (call_status === "in-progress") {
        const current_time = Math.floor(Date.now() / 1000);
        const video_call_start_time = Math.floor(
          new Date(callHistory.call_start).getTime() / 1000
        );

        const time_difference = current_time - video_call_start_time;
        const total_time_in_second = callHistory.waiting_time;
        remaining_time_in_second = total_time_in_second - time_difference;
      } else {
        remaining_time_in_second = callHistory.waiting_time;
      }
      if (remaining_time_in_second > 0) {
        minutes = Math.round((remaining_time_in_second / 60) * 100) / 100;
      } else {
        remaining_time_in_second = 0;
      }
    }
    // Handle call type
    else if (
      callHistory.call_type === "call" &&
      (call_status === "in-progress" || call_status === "request")
    ) {
      const in_app_voice_call = callHistory.is_inapp_voice_call;
      if (in_app_voice_call && in_app_voice_call === 1) {
        if (call_status === "in-progress") {
          const current_time = Math.floor(Date.now() / 1000);
          const call_start_time = Math.floor(
            new Date(callHistory.call_start).getTime() / 1000
          );

          const time_difference = current_time - call_start_time;
          const total_time_in_second = callHistory.waiting_time;
          remaining_time_in_second = total_time_in_second - time_difference;
        } else {
          remaining_time_in_second = callHistory.waiting_time;
        }
        if (remaining_time_in_second > 0) {
          minutes = Math.round((remaining_time_in_second / 60) * 100) / 100;
        } else {
          remaining_time_in_second = 0;
        }
      }
    }
  }

  result.call_status = call_status;
  result.remaining_time_in_second = remaining_time_in_second;
  result.minutes = minutes;

  return result;
}

export async function getApprovedArchitectRequest(uniqeid) {
  return await ArchitectServiceOrder.findOne({
    where: {
      uniqeid: uniqeid,
      status: "approved",
    },
  });
}

export async function getAstrologerById(astro_id) {
  return await Astrologer.findOne({
    where: { astrologer_uni_id: astro_id },
    include: [
      {
        model: User,
        as: "user",
        required: true,
      },
    ],
  });
}
async function getTotalBalanceGiftById(uni_id) {
  // Calculate total credits
  const total_cr = await Wallet.sum("amount", {
    where: {
      user_uni_id: uni_id,
      main_type: "cr",
      offer_status: 1,
      status: 1,
    },
  });

  // Calculate total debits
  const total_dr = await Wallet.sum("amount", {
    where: {
      user_uni_id: uni_id,
      main_type: "dr",
      offer_status: 1,
      status: 1,
    },
  });

  // Calculate gift total, defaulting null sums to 0
  const giftTotal = parseFloat(total_cr || 0) - parseFloat(total_dr || 0);

  // Return the result rounded to two decimal places
  return Math.round(giftTotal * 100) / 100;
}

export const getTotalBalanceMainById = async (uni_id) => {
  try {
    const totalCrResult = await Wallet.findOne({
      attributes: [
        [
          Sequelize.fn("SUM", Sequelize.literal("amount / exchange_rate")),
          "totalCr",
        ],
      ],
      where: {
        user_uni_id: uni_id,
        main_type: "cr",
        status: 1,
        offer_status: 0,
      },
      raw: true,
    });

    const totalDrResult = await Wallet.findOne({
      attributes: [
        [
          Sequelize.fn("SUM", Sequelize.literal("amount / exchange_rate")),
          "totalDr",
        ],
      ],
      where: {
        user_uni_id: uni_id,
        main_type: "dr",
        status: 1,
        offer_status: 0,
      },
      raw: true,
    });

    const totalCr = parseFloat(totalCrResult.totalCr || 0);
    const totalDr = parseFloat(totalDrResult.totalDr || 0);

    const giftTotal = totalCr - totalDr;

    return Math.round(giftTotal * 100) / 100;
  } catch (error) {
    console.error("Error in getTotalBalanceMainById:", error);
    throw error;
  }
};

export const convertToINR = async (amount, exchange_rate) => {
  if (exchange_rate <= 0) {
    exchange_rate = 1;
  }

  const convertedAmount = Math.round(amount * exchange_rate * 100) / 100;
  return convertedAmount;
};

export const walletHistoryCreate = async (data = {}) => {
  // Extract and set default values
  const astrologer_uni_id = data.astrologer_uni_id || 0;
  const admin_percentage = data.admin_percentage || 0;
  const user_uni_id = data.user_uni_id || 0;
  const useAmount = data.useAmount || 0;
  const duration = data.duration || 0;
  const call_type = data.call_type || "";
  const uniqeid = data.uniqeid || "";
  const astro_offer_call_amount = data.astro_offer_call_amount || 0;

  // Determine type message based on call_type
  let type_msg = "";
  switch (call_type) {
    case "call":
      type_msg = "Calling";
      break;
    case "video":
      type_msg = "Video Calling";
      break;
    case "callwithlive":
      type_msg = "Calling on Live";
      break;
    case "videocallwithlive":
      type_msg = "Video Calling on Live";
      break;
    case "privatecallwithlive":
      type_msg = "Private Calling on Live";
      break;
    case "privatevideocallwithlive":
      type_msg = "Private Video Calling on Live";
      break;
    case "chat":
      type_msg = "Chat";
      break;
    default:
      type_msg = "";
  }

  if (astro_offer_call_amount == 1) {
    // Get astrologer's currency details
    const currency_detail = await getCurrency(astrologer_uni_id, "all");
    const { currency_code, currency_symbol, exchange_rate } = currency_detail;

    // Create wallet history description
    const wallet_history_description_astro = `On offer ${type_msg} Amount For ${Math.floor(duration / 60)}:${duration % 60} Min. by admin`;
    console.log(
      "wallet_history_description_astro:::",
      wallet_history_description_astro
    );
    const finaltds = 0;
    const astroAmount = useAmount - finaltds;

    // Prepare astrologer wallet history data
    const postAstroWalletHistoryData = {
      user_uni_id: astrologer_uni_id,
      transaction_code: "add_wallet_by_calling_by_admin",
      wallet_history_description: wallet_history_description_astro,
      transaction_amount: astroAmount,
      amount: astroAmount,
      main_type: "cr",
      admin_percentage: admin_percentage,
      admin_amount: 0,
      tds_amount: finaltds,
      offer_amount: 0,
      reference_id: uniqeid,
      status: 1,
      gateway_payment_id: "", // mene add kiya hai
      created_by: astrologer_uni_id,
      currency_code,
      currency_symbol,
      exchange_rate,
    };

    // Create wallet history record
    await Wallet.create(postAstroWalletHistoryData);
  } else {
    // Get user's currency details
    const currency_detail = await getCurrency(user_uni_id, "all");
    const { currency_code, currency_symbol, exchange_rate } = currency_detail;

    // Get user's gift balance
    const wallet_gift_balance = await getTotalBalanceGiftById(user_uni_id);

    // Create wallet history description
    const wallet_history_description = `${type_msg} Charge For Astrologer ${Math.floor(duration / 60)}:${duration % 60} Min.`;

    let deduct = 0;
    let offer_amount = 0;

    if (getConfig("offer_ammount_status")) {
      if (getConfig("main_balance_deduct_first") == 1) {
        const wallet_main_balance = await getTotalBalanceMainById(user_uni_id);

        if (useAmount <= wallet_main_balance) {
          deduct = useAmount;
        } else {
          deduct = useAmount;
          offer_amount = useAmount - deduct;
        }
      } else if (getConfig("balance_deduct_fifty_fifty") == 1) {
        const wallet_main_balance = await getTotalBalanceMainById(user_uni_id);

        const half_amount = Math.round((useAmount / 2) * 100) / 100;

        if (
          wallet_gift_balance >= half_amount &&
          wallet_main_balance >= half_amount
        ) {
          offer_amount = half_amount;
          deduct = half_amount;
        } else if (
          wallet_gift_balance >= half_amount &&
          wallet_main_balance < half_amount
        ) {
          deduct = wallet_main_balance;
          offer_amount = useAmount - deduct;
        } else if (
          wallet_gift_balance < half_amount &&
          wallet_main_balance >= half_amount
        ) {
          offer_amount = wallet_gift_balance;
          deduct = useAmount - offer_amount;
        } else {
          offer_amount = wallet_gift_balance;
          deduct = wallet_main_balance;
        }
      } else {
        if (useAmount <= wallet_gift_balance) {
          offer_amount = useAmount;
        } else {
          offer_amount = wallet_gift_balance;
          deduct = useAmount - offer_amount;
        }
      }
    } else {
      deduct = useAmount;
    }

    // Create wallet history for offer amount
    if (offer_amount > 0) {
      const inr_offer_amount = await convertToINR(offer_amount, exchange_rate);

      const postWalletHistoryData = {
        user_uni_id: user_uni_id,
        transaction_code: "remove_wallet_by_calling_offer",
        wallet_history_description,
        transaction_amount: inr_offer_amount,
        main_type: "dr",
        amount: inr_offer_amount,
        reference_id: uniqeid,
        created_by: user_uni_id,
        gateway_payment_id: "", // mene add kiya hai
        status: 1,
        offer_status: 1,
        currency_code,
        currency_symbol,
        exchange_rate,
      };
      await Wallet.create(postWalletHistoryData);
    }

    // Create wallet history for deducted amount
    if (deduct > 0) {
      const inr_deduct = await convertToINR(deduct, exchange_rate);

      const postWalletHistoryData = {
        user_uni_id: user_uni_id,
        transaction_code: "remove_wallet_by_calling",
        wallet_history_description,
        transaction_amount: inr_deduct,
        main_type: "dr",
        amount: inr_deduct,
        reference_id: uniqeid,
        created_by: user_uni_id,
        status: 1,
        gateway_payment_id: "", // mene add kiya hai
        currency_code,
        currency_symbol,
        exchange_rate,
      };
      await Wallet.create(postWalletHistoryData);
    }
    // Create wallet history for astrologer
    const wallet_history_descriptionAdd = `${type_msg} Amount For User ${Math.floor(duration / 60)}:${duration % 60} Min.`;
    console.log(
      "wallet_history_descriptionAdd:::",
      wallet_history_descriptionAdd
    );

    let admin_amount = 0;
    if (admin_percentage && deduct) {
      admin_amount = (admin_percentage / 100) * deduct;
    }

    const astrPartAmount = Math.round((deduct - admin_amount) * 100) / 100;

    const tds = getConfig("tds");
    const finaltds =
      tds && tds > 0 ? Math.round((tds / 100) * astrPartAmount * 100) / 100 : 0;

    const astroAmount = astrPartAmount - finaltds;

    // Get astrologer's currency details
    const astro_currency_detail = await getCurrency(astrologer_uni_id, "all");

    const {
      currency_code: astro_currency_code,
      currency_symbol: astro_currency_symbol,
      exchange_rate: astro_exchange_rate,
    } = astro_currency_detail;

    // Convert amounts to INR
    const inr_astroAmount = await convertToINR(astroAmount, exchange_rate);
    const inr_admin_amount = await convertToINR(admin_amount, exchange_rate);
    const inr_finaltds = await convertToINR(finaltds, exchange_rate);
    const inr_offer_amount = await convertToINR(offer_amount, exchange_rate);

    // Prepare astrologer wallet history data
    const postAstroWalletHistoryData = {
      user_uni_id: astrologer_uni_id,
      transaction_code: "add_wallet_by_calling",
      wallet_history_description: wallet_history_descriptionAdd,
      transaction_amount: inr_astroAmount,
      amount: inr_astroAmount,
      main_type: "cr",
      admin_percentage,
      admin_amount: inr_admin_amount,
      tds_amount: inr_finaltds,
      offer_amount: inr_offer_amount,
      reference_id: uniqeid,
      status: 1,
      gateway_payment_id: "", // mene add kiya hai
      created_by: astrologer_uni_id,
      currency_code: astro_currency_code,
      currency_symbol: astro_currency_symbol,
      exchange_rate: astro_exchange_rate,
    };

    // Create astrologer wallet history record
    await Wallet.create(postAstroWalletHistoryData);
  }
};

export const waitingCustomer = async (astrologer_uni_id) => {
  try {
    const running_count = await CallHistory.count({
      where: {
        astrologer_uni_id,
        status: { [Op.in]: ["request", "in-progress"] },
        call_type: { [Op.in]: ["call", "chat"] },
      },
    });

    if (running_count === 0) {
      const call_history = await CallHistory.findAll({
        include: [
          {
            model: User,
            as: "customer_user", // Changed from "customer" to "customer_user" to match the association
            required: false,
            on: {
              user_uni_id: {
                [Op.eq]: Sequelize.col("call_history.customer_uni_id"),
              },
            },
          },
        ],
        where: {
          astrologer_uni_id,
          status: "queue",
        },
        order: [["id", "ASC"]],
      });

      const first_call_offer = getConfig("first_call_offer");
      const first_call_free_minutes = getConfig("first_call_free_minutes");

      for (const history of call_history) {
        const astrologer = await Astrologer.findOne({
          where: { astrologer_uni_id },
        });
        // const currency = getCurrency(history.customer.phone);

        const currency = getCurrency(history.customer_user.phone);

        const astrologer_price = await getAstroPriceDataType(
          astrologer_uni_id,
          history.call_type,
          currency,
          history.customer_uni_id
        );
        const user_wallet_amt = await getTotalBalanceById(
          history.customer_uni_id
        );

        if (astrologer_price.price && astrologer_price.price > 0) {
          let isFreeCall = 0;
          const isFirstCall = await isFirstUser(history.customer_uni_id);
          if (
            !isFirstCall &&
            first_call_offer === "3" &&
            first_call_free_minutes > 0 &&
            freeMinutesOfferOn().includes(history.call_type)
          ) {
            isFreeCall = 1;
          }

          if (
            (user_wallet_amt >= 0 &&
              astrologer_price.price <= user_wallet_amt) ||
            isFreeCall === 1
          ) {
            if (
              !astrologer.next_request_time ||
              astrologer.next_request_time !== getConfig("current_datetime")
            ) {
              const next_request_time = getConfig("current_datetime");
              await astrologer.update({ next_request_time });
              return {
                id: history.id,
                user_uni_id: history.customer_uni_id,
                astrologer_uni_id: history.astrologer_uni_id,
                call_type: history.call_type,
              };
            }
          } else {
            await CallHistory.update(
              { status: "Declined(Insufficient Balance)" },
              { where: { uniqeid: history.uniqeid } }
            );
            await removeBusyStatus(astrologer_uni_id);
          }
        }
      }
    }
    return {};
  } catch (error) {
    console.error("Error in waitingCustomer:", error);
    return {};
  }
};

export const callTransations = async (data) => {
  try {
    const {
      uniqeid,
      startTime,
      endTime,
      duration,
      RecordingUrl = "",
      call_type,
    } = data;
    let astrologer_uni_id = "";
    console.log(
      "callTransations+data:",
      uniqeid,
      startTime,
      endTime,
      duration,
      RecordingUrl,
      call_type
    );
    // First query - find history
    const history = await CallHistory.findOne({
      where: {
        uniqeid,
        status: { [Op.in]: ["queue", "request", "in-progress"] },
      },
    });
 // Second query - find calls with user data
    const calls = await CallHistory.findOne({
      include: [
        {
          model: User,
          as: "user",
          required: false,
        },
      ],
      where: {
        uniqeid,
        status: { [Op.ne]: "completed" },
      },
    });

    if (calls && calls.user) {
      const currency = getCurrency(calls.user.phone);
      const user_uni_id = calls.customer_uni_id;
      astrologer_uni_id = calls.astrologer_uni_id;

      // Get astrologer details with proper alias
      const astroDetail = await getAstrologerById(astrologer_uni_id);

      if (!astroDetail) {
        if (history) {
          await history.update({ status: "Invalid Call." });
        }
        await removeBusyStatus(astrologer_uni_id);
        return { status: 0, msg: "Astrologer not found" };
      }

      let is_architect_call_history = 0;
      let is_architect_chat = 0;
      if (calls.ref_id) {
        const approvedArchitectRequest = await getApprovedArchitectRequest(
          calls.ref_id
        );
        if (approvedArchitectRequest) {
          is_architect_call_history = 1;
          if (calls.call_type === "chat") {
            is_architect_chat = 1;
          }
        }
      }

      let offer_type_txt = "";
      let isFreeFirstCall = 0;
      let useAmount = 0;
      let wallet_balance = 0;
      let deductable_duration = 0;

      if (is_architect_call_history === 0) {
        const astroPrices = await getAstroPriceDataType(
          astrologer_uni_id,
          call_type,
          currency,
          calls.customer_uni_id
        );
        wallet_balance = await getTotalBalanceById(user_uni_id);

        deductable_duration = duration;

        const isFirstCall = await isFirstUser(user_uni_id);
        if (!isFirstCall) {
          const first_call_offer = constants.first_call_offer;
          const first_call_price = constants.first_call_price_per_min;
          const first_call_free_minutes = constants.first_call_free_minutes;
          if (first_call_offer) {
            if (
              first_call_offer === "2" &&
              first_call_price > 0 &&
              lowPriceOfferOn().includes(call_type)
            ) {
              offer_type_txt = first_call_offer;
            } else if (
              first_call_offer === "3" &&
              first_call_free_minutes > 0 &&
              freeMinutesOfferOn().includes(call_type)
            ) {
              isFreeFirstCall = 1;
              deductable_duration = 0;
              offer_type_txt = first_call_offer;
            }
          }
        }

        if (isFreeFirstCall === 0) {
          if (
            constants.free_duration &&
            constants.free_duration_allow < duration
          ) {
            deductable_duration = duration - constants.free_duration;
            if (deductable_duration < 0) deductable_duration = 0;
          }

          if (deductable_duration && constants.amount_deduct_minute_wise) {
            const minutes = deductMinuteCalculat(
              astroPrices.time_in_minutes,
              deductable_duration
            );
            useAmount = Math.round(astroPrices.price * minutes * 100) / 100;
          } else if (deductable_duration) {
            useAmount =
              Math.round(astroPrices.price * (deductable_duration / 60) * 100) /
              100;
          }

          if (
            wallet_balance > 0 &&
            useAmount > 0 &&
            useAmount > wallet_balance
          ) {
            useAmount = wallet_balance;
          }
        }
      }

      const refund_call_days = constants.refund_call_days;
      const now_date_for_valid = new Date();
      let refundValidDate = "";
      if (refund_call_days > 0) {
        const refundDate = new Date(now_date_for_valid);
        refundDate.setDate(refundDate.getDate() + refund_call_days);
        refundValidDate = refundDate.toISOString().split("T")[0];
      }

      let result = {};

      if (wallet_balance > 0 && useAmount > 0 && wallet_balance >= useAmount) {
        const callHistoryData = {
          call_start: startTime,
          call_end: endTime,
          duration,
          recording: RecordingUrl,
          status: "completed",
          refund_valid_date: refundValidDate,
          offer_type: offer_type_txt,
        };
        await CallHistory.update(callHistoryData, { where: { uniqeid } });
        await removeBusyStatus(astrologer_uni_id);

        const admin_percentage =
          astroDetail.admin_percentage &&
          parseInt(astroDetail.admin_percentage) > 0
            ? astroDetail.admin_percentage
            : constants.admin_percentage;

        const postAstroWalletHistoryData = {
          astrologer_uni_id,
          admin_percentage,
          user_uni_id,
          call_type,
          useAmount,
          duration,
          uniqeid,
        };
        await walletHistoryCreate(postAstroWalletHistoryData);

        result = { status: 1, msg: "successfully." };
      } else if (duration > 0 && deductable_duration === 0) {
        const callHistoryData = {
          call_start: startTime,
          call_end: endTime,
          duration,
          recording: RecordingUrl,
          status: "completed",
          refund_valid_date: refundValidDate,
          offer_type: offer_type_txt,
        };
        await CallHistory.update(callHistoryData, { where: { uniqeid } });
        await removeBusyStatus(astrologer_uni_id);

        result = { status: 1, msg: "successfully." };
      } else {
        if (history) {
          await history.update({ status: "Declined(Insufficient Balance)" });
        }
        await removeBusyStatus(astrologer_uni_id);
        result = {
          status: 0,
          msg: "You Have Not Sufficent Balance Kindly Recharge call transactions",
        };
      }

      if (astrologer_uni_id) {
        const waitingCustomerData = await waitingCustomer(astrologer_uni_id);

        if (waitingCustomerData && waitingCustomerData.call_type) {
          await startCall(waitingCustomerData, waitingCustomerData.call_type);
        }
      }

      return result;
    } else {
      if (history) {
        await history.update({ status: "Invalid Call." });
      }
      await removeBusyStatus(astrologer_uni_id);
      return { status: 0, msg: "Invalid Calll." };
    }
  } catch (error) {
    console.error("Error in callTransations::", error);
    return { status: 0, msg: "Something went wrong 1. Please try again" };
  }
};

export const removeBusyStatus = async (astrologer_uni_id) => {
  try {
    const call_history = await CallHistory.findAll({
      include: [
        {
          model: UserModel,
          as: "customer_user", // Changed from "users" to "customer_user"
          required: false,
        },
      ],
      where: {
        astrologer_uni_id,
        status: {
          [Op.in]: ["queue", "queue_request", "request", "in-progress"],
        },
      },
    });

    if (call_history.length === 0) {
      await Astrologer.update(
        { busy_status: "0" },
        { where: { astrologer_uni_id } }
      );
    }
  } catch (error) {
    console.error("Error in removeBusyStatus:", error);
  }
};

export const alreadySentRequest = async (
  customer_uni_id,
  astrologer_uni_id
) => {
  try {
    const count = await CallHistory.count({
      where: {
        customer_uni_id,
        status: {
          [Op.in]: ["queue", "queue_request", "request", "in-progress"],
        },
      },
    });
    return count > 0;
  } catch (error) {
    console.error("Error in alreadySentRequest:", error);
    return false;
  }
};

export const free_minutes_offer_on = () => {
  const result = [];
  if (constants.free_minutes_offer_on_voice_call === 1) result.push("call");
  if (constants.free_minutes_offer_on_chat === 1) result.push("chat");
  if (constants.free_minutes_offer_on_video_call === 1) result.push("video");
  return result;
};

export const availableMinuteCalculat = async (
  price,
  per_minutes,
  total_balance,
  customer_uni_id = "",
  call_type = ""
) => {
  let total_minutes = 0;
  const isFirstCall = isFirstUser(customer_uni_id);
  const first_call_offer = constants.first_call_offer;
  const first_call_free_minutes = constants.first_call_free_minutes;

  if (
    !isFirstCall &&
    first_call_offer === "3" &&
    first_call_free_minutes > 0 &&
    free_minutes_offer_on().includes(call_type)
  ) {
    total_minutes = first_call_free_minutes;
  }

  if (total_minutes <= 0) {
    const per_minutes_val = per_minutes || 1;
    if (price > 0 && per_minutes_val > 0 && total_balance > 0) {
      total_minutes = Math.floor(total_balance / price) * per_minutes_val;
    }
  }

  total_minutes = Math.floor(total_minutes);
  const call_max_minutes = constants.call_max_minutes;
  if (call_max_minutes && !isNaN(call_max_minutes)) {
    const max_minutes = Math.floor(call_max_minutes);
    if (total_minutes > max_minutes) total_minutes = max_minutes;
  }

  return total_minutes;
};

export const waitingTime = async (astrologer_uni_id) => {
  try {
    const call_history = await CallHistory.findAll({
      include: [
        {
          model: User,
          as: "customer_user",
          on: {
            user_uni_id: {
              [Op.eq]: Sequelize.col("call_history.customer_uni_id"),
            },
          },
        },
      ],
      where: {
        astrologer_uni_id,
        status: {
          [Op.in]: ["queue", "queue_request", "request", "in-progress"],
        },
      },
    });

    let availableMinute = 0;
    for (const history of call_history) {
      try {
        const currency = await getCurrency(history.customer_user.phone);

        const astrologer_price = await getAstroPriceDataType(
          astrologer_uni_id,
          history.call_type,
          currency,
          history.customer_uni_id
        );

        if (!astrologer_price) {
          console.warn(`No price found for astrologer ${astrologer_uni_id}`);
          continue;
        }

        const user_wallet_amt = await getTotalBalanceById(
          history.customer_uni_id
        );

        const minutes = await availableMinuteCalculat(
          astrologer_price.price,
          astrologer_price.time_in_minutes,
          user_wallet_amt,
          history.customer_uni_id,
          history.call_type
        );

        availableMinute += minutes;
      } catch (error) {
        console.error(`Error processing call history ${history.id}:`, error);
        continue;
      }
    }
    return availableMinute;
  } catch (error) {
    console.error("Error in waitingTime:", error);
    return 0;
  }
};

export function pre_zero(num, dig) {
  return String(num).padStart(dig, "0");
}

export const new_sequence_code = async (code) => {
  try {
    let rescode = await SequenceCode.findOne({
      where: { sequence_code: code },
    });
    if (!rescode) {
      rescode = await SequenceCode.create({
        sequence_code: code,
        sequence_number: "0000",
        created_at: getConfig("current_datetime"),
        updated_at: getConfig("current_datetime"),
      });
    }

    const sequence_code = parseInt(rescode.sequence_number, 10);
    const code_uni = sequence_code + 1;
    const uni_idd = code + pre_zero(code_uni, 4);
    await SequenceCode.update(
      { sequence_number: pre_zero(code_uni, 4) },
      { where: { sequence_code: code } }
    );
    return uni_idd;
  } catch (error) {
    console.error("Error in new_sequence_code:", error);
    return null;
  }
};

export const generateAgoraRtcToken = async (data = {}) => {
  const appID = getConfig("agora_api_id");
  const appCertificate = getConfig("agora_api_certificate");
  const RolePublisher = 1;
  const RoleSubscriber = 2;
  const channelName = data.uniqeid;
  const user = data.user_id || 0;
  const role = data.role === "audience" ? RoleSubscriber : RolePublisher;
  const expireTimeInSeconds = 3600 * 24;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;
  console.log(
    "generateAgoraRtcToken data:::",
    appID,
    appCertificate,
    channelName,
    user,
    role,
    privilegeExpiredTs
  );

  const rtcToken = buildTokenWithUserAccount(
    appID,
    appCertificate,
    channelName,
    user,
    role,
    privilegeExpiredTs
  );
  return { token: rtcToken };
};

export const exotelCustomerWhitelistCurl = async (Number) => {
  try {
    const postData = new URLSearchParams({
      VirtualNumber: process.env.EXOTEL_CALLER_ID,
      Number,
      Language: "en",
    });

    const apiKey = getConfig("export_api_key");
    const apiToken = getConfig("export_api_token");
    const exotelSid = getConfig("export_sid");
    const subdomain = getConfig("export_api_subdomaim");

    const url = `https://${apiKey}:${apiToken}${subdomain}/v1/Accounts/${exotelSid}/CustomerWhitelist.json`;

    const response = await axios.post(url, postData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Exotel whitelist error:",
      error.response?.data || error.message
    );
    return null;
  }
};

export const exotelCallRequestCurl = async (
  astronumber,
  customernumber,
  second
) => {
  console.log("exotelCallRequestCurl:", astronumber, customernumber, second);
  try {
    const maxSeconds = 14400;
    second = second > maxSeconds ? maxSeconds : second;

    const StatusCallbackUrl = `${constants.base_url}/api/statusCallback`;

    const postData = new URLSearchParams({
      From: astronumber,
      To: customernumber,
      CallerId: getConfig("exotel_caller_id"),
      CallType: "trans",
      TimeLimit: second,
      StatusCallback: StatusCallbackUrl,
      "StatusCallbackEvents[0]": "terminal",
      StatusCallbackContentType: "multipart/form-data",
      Record: "true",
    });

    const apiKey = getConfig("export_api_key");
    const apiToken = getConfig("export_api_token");
    const exotelSid = getConfig("export_sid");
    const subdomain = getConfig("export_api_subdomaim");

    const url = `https://${apiKey}:${apiToken}${subdomain}/v1/Accounts/${exotelSid}/Calls/connect.json`;

    const response = await axios.post(url, postData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Exotel call request failed:",
      error.response?.data || error.message
    );
    return null;
  }
};

// export const sendNotification = async (data) => {
//   const serviceAccountPath = path.join(__dirname, "service-account.json");
//   const client = new GoogleClient();
//   client.setAuthConfig(serviceAccountPath);
//   client.addScope("https://www.googleapis.com/auth/firebase.messaging");
//   const accessToken = (await client.fetchAccessTokenWithAssertion())
//     .access_token;

//   const logoUrl = constants.logo
//     ? `${constants.base_url}/public/${constants.setting_image_path}${constants.logo}`
//     : "";

//   const notificationData = {
//     title: data.title || "",
//     body: data.description || "",
//     image: data.image || "",
//     logo: logoUrl,
//     sound: "mySound",
//     type: data.type || "",
//     channelName: data.channelName || "",
//     user_uni_id: data.user_uni_id || "",
//     astrologer_uni_id: data.astrologer_uni_id || "",
//     start_time: data.start_time || "",
//     duration: data.duration || "",
//     click_action: data.click_action || constants.base_url,
//     notification_id: data.notification_id || new_push_notification_id("PNOTI"),
//     cancel_status: data.cancel_status || 0
//   };

//   const uniqueTokens = [...new Set(data.chunk)];
//   const responses = [];

//   for (const token of uniqueTokens) {
//     if (token) {
//       const payload = {
//         message: {
//           token,
//           notification: {
//             title: data.title || "",
//             body: data.description || "",
//             image: data.image || ""
//           },
//           data: {
//             title: data.title || "",
//             body: data.description || "",
//             image: data.image || "",
//             logo: logoUrl,
//             sound: "mySound",
//             type: data.type || "",
//             channelName: data.channelName || "",
//             user_uni_id: data.user_uni_id || "",
//             astrologer_uni_id: data.astrologer_uni_id || "",
//             start_time: data.start_time || "",
//             duration: String(data.duration || ""),
//             click_action: data.click_action || constants.base_url,
//             notification_id: String(
//               data.notification_id || new_push_notification_id("PNOTI")
//             ),
//             cancel_status: String(data.cancel_status || 0),
//             other_data: JSON.stringify(notificationData)
//           },
//           android: { priority: "high" }
//         }
//       };

//       try {
//         const response = await fetch(
//           `https://fcm.googleapis.com/v1/projects/${constants.project_id}/messages:send`,
//           {
//             method: "POST",
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               "Content-Type": "application/json"
//             },
//             body: JSON.stringify(payload)
//           }
//         );
//         responses.push(await response.json());
//       } catch (error) {
//         console.error("Error sending notification:", error);
//       }
//     }
//   }

//   return responses;
// };

export const sendNotification = async (data) => {
  try {
    const messaging = firebaseAdmin.messaging();

    const logo = getConfig("logo");
    let logoUrl = "";
    logoUrl = `${constants.base_url}/${constants.setting_image_path}${logo}`;
    const logoPath = path.join(constants.setting_image_path, logo);
    if (logo && fs.existsSync(logoPath)) {
      //uploads/setting/55654.jpg
      logoUrl = `${constants.base_url}/${constants.setting_image_path}${logo}`;
    }

    const notificationData = {
      title: data.title || "",
      body: data.description || "",
      image: data.image || "",
      logo: logoUrl,
      type: data.type || "",
      // click_action: data.click_action || getConfig('baseUrl'),
      notification_id: parseInt(data.notification_id || Date.now()), // or a custom push ID generator
      cancel_status: parseInt(data.cancel_status || 0),
      url: data.url || "",
      customerDetail: data.customerDetail || "",
      uniqueId: data.uniqueId || "",
      customerUniId: data.customerUniId || "",
      customerName: data.customerName || "",
      customerImage: data.customerImage || "",
      astrologerUniId: data.astrologerUniId || "",
      astrologerName: data.astrologerName || "",
      astrologerImage: data.astrologerImage || "",
      channelName: data.channelName || "",
      custom_url: data.custom_url || "",
    };

    const tokens = Array.from(new Set(data.chunk || [])).filter(Boolean);
    if (!tokens.length) {
      return { error: "No valid tokens provided." };
    }

    const message = {
      data: notificationData,
      android: {
        priority: "high",
      },
      tokens: tokens,
    };

    const response = await messaging.sendMulticast(message);
    const failed = response.failureCount;
    const success = response.successCount;

    const failureDetails = [];
    const failedTokens = [];

    response.responses.forEach((res, idx) => {
      if (!res.success) {
        failureDetails.push({
          error: res.error.message,
          token: tokens[idx],
        });
        failedTokens.push(tokens[idx]);
      }
    });

    const successfulTokens = tokens.filter(
      (token) => !failedTokens.includes(token)
    );

    // Optionally reset uninstall flag
    if (!failureDetails.length && tokens.length === 1) {
      // Example:
      // await User.update({ is_uninstalled: 0 }, { where: { user_fcm_token: tokens[0] } });
    }

    return {
      success,
      failed,
      failureDetails,
      successfulTokens,
    };
  } catch (err) {
    return { error: err.message };
  }
};

export const secondToTime = (seconds) => {
  if (seconds) {
    const date = new Date(0);
    date.setSeconds(seconds);
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }
  return "";
};

export const low_price_offer_on = () => {
  const result = [];

  if (getConfig("low_price_offer_on_voice_call") == 1) {
    result.push("call");
  }

  if (getConfig("low_price_offer_on_chat") == 1) {
    result.push("chat");
  }

  if (getConfig("low_price_offer_on_video_call") == 1) {
    result.push("video");
  }

  return result;
};
export const checkCallToken = async (uniqeid = "") => {
  let status = false;
  if (uniqeid) {
    const callHistory = await CallHistory.findOne({
      where: { uniqeid: uniqeid },
    });
    if (callHistory && callHistory.token && callHistory.token !== null) {
      status = false;
    } else {
      status = true;
    }
  }
  return status;
};
// start Call

export const startCall = async (array, call_type) => {
  let charge_for_clevertap = 0;
  let result = {};
  const firebase_custom_auth_token = await checkFirebaseCustomAuthToken(
    array.user_uni_id
  );
  if (firebase_custom_auth_token) {
    let in_app_voice_call = 0;
    if (array.is_inapp_voice_call !== undefined) {
      if (array.is_inapp_voice_call == 1) {
        in_app_voice_call = array.is_inapp_voice_call;
      }
    }
    const customer = await getCustomerById(array.user_uni_id);

    const astrologer = await Astrologer.findOne({
      where: { astrologer_uni_id: array.astrologer_uni_id },
      include: [
        {
          model: User,
          as: "user",
          required: true,
          where: { user_uni_id: array.astrologer_uni_id },
        },
      ],
    });

    const currency_detail = await getCurrency(customer.user.phone, "all");
    const currency_code = currency_detail.currency_code;
    const currency_symbol = currency_detail.currency_symbol;
    const exchange_rate = currency_detail.exchange_rate;

    const astrologer_price = await getAstroPriceDataType(
      array.astrologer_uni_id,
      call_type,
      currency_code,
      array.user_uni_id
    );
    const user_wallet_amt = await getTotalBalanceById(array.user_uni_id);

    let call_by_cronjob = 0;
    if (array.call_by_cronjob !== undefined) {
      if (array.call_by_cronjob && array.call_by_cronjob != null) {
        call_by_cronjob = array.call_by_cronjob;
      }
    }

    if (!array.uniqeid || array.uniqeid == null) {
      array.uniqeid = await alreadySentRequestUniqeid(
        array.user_uni_id,
        array.astrologer_uni_id
      );
    }

    let astrologer_uni_id = "";
    let callHistory = null;
    let uniqeid = "";
    let is_queue_request = 0;
    let offer_type = 0;
    let my_queue_number = 0;
    let is_chat_in_progress = 0;
    let is_call_in_progress = 0;
    let is_video_call_in_progress = 0;
    let intake_status = 0;

    if (array.uniqeid) {
      uniqeid = array.uniqeid;
      callHistory = await CallHistory.findOne({ where: { uniqeid: uniqeid } });

      const waitings_number = await getCustomerQueueList(array.user_uni_id);
      if (waitings_number && waitings_number.length > 0) {
        for (const waitings_num of waitings_number) {
          if (waitings_num.uniqeid == uniqeid) {
            my_queue_number = waitings_num.my_queue_number;
            break;
          }
        }
      }

      if (callHistory) {
        if (
          ["queue", "queue_request", "request"].includes(callHistory.status)
        ) {
          is_queue_request = 1;
          offer_type = callHistory.offer_type || 0;
          if (!Number.isInteger(offer_type)) offer_type = 0;

          if (callHistory.is_inapp_voice_call !== undefined) {
            in_app_voice_call = callHistory.is_inapp_voice_call;
          }
        }

        if (
          callHistory.call_type == "chat" &&
          ["in-progress", "request"].includes(callHistory.status)
        ) {
          is_chat_in_progress = 1;
        } else if (
          callHistory.call_type == "video" &&
          ["in-progress", "request"].includes(callHistory.status)
        ) {
          is_video_call_in_progress = 1;
        } else {
          if (
            callHistory.is_inapp_voice_call &&
            callHistory.is_inapp_voice_call == 1
          ) {
            if (
              callHistory.call_type == "call" &&
              ["in-progress", "request"].includes(callHistory.status)
            ) {
              is_call_in_progress = 1;
              in_app_voice_call = callHistory.is_inapp_voice_call;
            }
          } else if (
            callHistory.call_type == "call" &&
            callHistory.status == "in-progress"
          ) {
            is_call_in_progress = 1;
          }
        }
      }
    }

    if (is_chat_in_progress == 1) {
      if (call_type == "chat") {
        const remaining_result = await remainingChatTime(uniqeid);
        if (remaining_result.remaining_time_in_second > 0) {
          const minutes = remaining_result.minutes;
          const second = remaining_result.remaining_time_in_second;
          const senddata = {
            minutes: minutes,
            second: second,
            uniqeid: uniqeid,
            name: astrologer.user.name,
          };
          result = {
            status: 1,
            join_status: 2,
            intake_status: intake_status,
            my_queue_number: 0,
            is_chat_in_progress: is_chat_in_progress,
            data: senddata,
            msg: "You are rejoined the chat",
          };
        } else {
          const duration = callHistory.waiting_time;
          if (duration && duration > 0) {
            const call_end = new Date(
              new Date(callHistory.call_start).getTime() + duration * 1000
            )
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");
            const sendData = {
              uniqeid: callHistory.uniqeid,
              startTime: callHistory.call_start,
              endTime: call_end,
              duration: duration,
              call_type: "chat",
            };
            result = await callTransations(sendData);
          } else {
            if (callHistory) {
              astrologer_uni_id = callHistory.astrologer_uni_id;
              await callHistory.update({ status: "Invalid Call." });
            }
            await removeBusyStatus(astrologer_uni_id);
            if (astrologer_uni_id) {
              const waitingCustomerData =
                await waitingCustomer(astrologer_uni_id);
              if (waitingCustomerData && waitingCustomerData.call_type) {
                await startCall(
                  waitingCustomerData,
                  waitingCustomerData.call_type
                );
              }
            }
            result = {
              status: 0,
              msg: "Something is wrong please try again",
            };
          }
        }
      } else {
        result = {
          status: 0,
          msg: "You are already in on going chat please wait till it finish.",
        };
      }
    } else if (is_video_call_in_progress == 1) {
      if (call_type == "video") {
        const remaining_result = await remainingChatTime(uniqeid);
        if (remaining_result.remaining_time_in_second > 0) {
          const minutes = remaining_result.minutes;
          const second = remaining_result.remaining_time_in_second;
          const senddata = {
            minutes: minutes,
            second: second,
            uniqeid: uniqeid,
            name: astrologer.user.name,
          };
          result = {
            status: 1,
            join_status: 2,
            intake_status: intake_status,
            my_queue_number: 0,
            is_video_call_in_progress: is_video_call_in_progress,
            data: senddata,
            msg: "You are rejoined the video call",
          };
        } else {
          const duration = callHistory.waiting_time;
          if (duration && duration > 0) {
            const call_end = new Date(
              new Date(callHistory.call_start).getTime() + duration * 1000
            )
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");
            const sendData = {
              uniqeid: callHistory.uniqeid,
              startTime: callHistory.call_start,
              endTime: call_end,
              duration: duration,
              call_type: "video",
            };
            result = await callTransations(sendData);
          } else {
            if (callHistory) {
              astrologer_uni_id = callHistory.astrologer_uni_id;
              await callHistory.update({ status: "Invalid Video Call." });
            }
            await removeBusyStatus(astrologer_uni_id);
            if (astrologer_uni_id) {
              const waitingCustomerData =
                await waitingCustomer(astrologer_uni_id);
              if (waitingCustomerData && waitingCustomerData.call_type) {
                await startCall(
                  waitingCustomerData,
                  waitingCustomerData.call_type
                );
              }
            }
            result = {
              status: 0,
              msg: "Something is wrong please try again",
            };
          }
        }
      } else {
        result = {
          status: 0,
          msg: "You are already in on going video call please wait till it finish.",
        };
      }
    } else if (is_call_in_progress == 1) {
      if (in_app_voice_call && in_app_voice_call == 1) {
        if (call_type == "call") {
          const remaining_result = await remainingChatTime(uniqeid);
          if (remaining_result.remaining_time_in_second > 0) {
            const minutes = remaining_result.minutes;
            const second = remaining_result.remaining_time_in_second;
            const senddata = {
              minutes: minutes,
              second: second,
              uniqeid: uniqeid,
              name: astrologer.user.name,
            };
            result = {
              status: 1,
              join_status: 2,
              intake_status: intake_status,
              my_queue_number: 0,
              is_call_in_progress: is_call_in_progress,
              data: senddata,
              msg: "You are rejoined the voice call",
            };
          } else {
            const duration = callHistory.waiting_time;
            if (duration && duration > 0) {
              const call_end = new Date(
                new Date(callHistory.call_start).getTime() + duration * 1000
              )
                .toISOString()
                .slice(0, 19)
                .replace("T", " ");
              const sendData = {
                uniqeid: callHistory.uniqeid,
                startTime: callHistory.call_start,
                endTime: call_end,
                duration: duration,
                call_type: "call",
              };
              result = await callTransations(sendData);
            } else {
              if (callHistory) {
                astrologer_uni_id = callHistory.astrologer_uni_id;
                await callHistory.update({ status: "Invalid Call." });
              }
              await removeBusyStatus(astrologer_uni_id);
              if (astrologer_uni_id) {
                const waitingCustomerData =
                  await waitingCustomer(astrologer_uni_id);
                if (waitingCustomerData && waitingCustomerData.call_type) {
                  await startCall(
                    waitingCustomerData,
                    waitingCustomerData.call_type
                  );
                }
              }
              result = {
                status: 0,
                msg: "Something is wrong please try again",
              };
            }
          }
        } else {
          result = {
            status: 0,
            msg: "You are already in on going voice call please wait till it finish.",
          };
        }
      } else {
        result = {
          status: 0,
          msg: "You are already in on going voice call please wait till it finish.",
        };
      }
    } else {
      if (
        !callHistory ||
        (callHistory && callHistory.status != "Session Expired")
      ) {
        if (
          !(await alreadySentRequest(
            array.user_uni_id,
            array.astrologer_uni_id
          )) ||
          is_queue_request
        ) {
          let astro_online_status = 0;
          if (astrologer.online_status == 1) {
            if (astrologer.call_status == 1 && call_type == "call") {
              astro_online_status = 1;
            } else if (astrologer.chat_status == 1 && call_type == "chat") {
              astro_online_status = 1;
            } else if (astrologer.video_status == 1 && call_type == "video") {
              astro_online_status = 1;
            }
          }

          if (astro_online_status == 1) {
            if (
              (astrologer_price.price && astrologer_price.price > 0) ||
              astrologer_price.other_offer_type == 4
            ) {
              let isFreeFirstCall = 0;

              const isFirstCall = await isFirstUser(
                array.user_uni_id,
                array.astrologer_uni_id
              );
              let charge_minutes = astrologer_price.time_in_minutes;

              if (is_queue_request) {
                if (offer_type == "3") {
                  isFreeFirstCall = 1;
                }
              } else {
                if (!isFirstCall) {
                  let first_call_offer = getConfig("first_call_offer");
                  const checkAstroOfferAfterLimitExceed =
                    await checkAstroOfferAfterLimitExceed(
                      array.astrologer_uni_id
                    );
                  if (
                    checkAstroOfferAfterLimitExceed &&
                    Number.isInteger(checkAstroOfferAfterLimitExceed) &&
                    checkAstroOfferAfterLimitExceed > 0
                  ) {
                    first_call_offer = checkAstroOfferAfterLimitExceed;
                  }

                  const first_call_price = getConfig(
                    "first_call_price_per_min"
                  );
                  const first_call_free_minutes = getConfig(
                    "first_call_free_minutes"
                  );
                  if (first_call_offer) {
                    if (first_call_offer == "2") {
                      if (low_price_offer_on().includes(call_type)) {
                        offer_type = first_call_offer;
                      }
                    }
                    if (first_call_offer == "3") {
                      const check_astro_free_offer_limit =
                        await checkAstroOfferCallLimitAllow(
                          array.astrologer_uni_id
                        );
                      if (
                        first_call_free_minutes &&
                        first_call_free_minutes > 0 &&
                        (check_astro_free_offer_limit ||
                          getConfig(
                            "fixed_amount_to_astrologer_after_limit_exceed"
                          ) == 1)
                      ) {
                        if (free_minutes_offer_on().includes(call_type)) {
                          offer_type = first_call_offer;
                          isFreeFirstCall = 1;
                        }
                      }
                    }
                  }
                } else if (astrologer_price.other_offer_type !== undefined) {
                  offer_type = astrologer_price.other_offer_type;
                }
              }

              if (
                (user_wallet_amt >= 0 &&
                  astrologer_price.price <= user_wallet_amt) ||
                isFreeFirstCall == 1
              ) {
                const astroPrice = astrologer_price.price;

                if (offer_type != 3) {
                  charge_for_clevertap = astroPrice;
                }

                const minutes = await availableMinuteCalculat(
                  astroPrice,
                  charge_minutes,
                  user_wallet_amt,
                  array.user_uni_id,
                  call_type,
                  uniqeid,
                  array.astrologer_uni_id
                );
                const second = minutes * 60;
                const getWaitingTime = await waitingTime(
                  array.astrologer_uni_id
                );

                const ivr_count = constants.ivr_count;
                const ivr_after_seconds = constants.ivr_after_seconds;
                const request_waiting = constants.request_waiting;

                // const waiting_for_request = formatDateTime(
                //   new Date(Date.now() + request_waiting * 1000)
                // );

                function formatDateTimeToMySQL(date) {
                  return date.toISOString().slice(0, 19).replace("T", " ");
                }

                const waiting_for_request = formatDateTimeToMySQL(
                  new Date(Date.now() + request_waiting * 1000)
                );

                let is_review = call_type === "call" ? 0 : 1;

                if (!is_queue_request) {
                  if (call_type === "chat") {
                    uniqeid = await new_sequence_code("CHAT");
                  } else if (call_type === "call") {
                    uniqeid = await new_sequence_code("CALL");
                  } else if (call_type === "video") {
                    uniqeid = await new_sequence_code("VIDEO");
                  }

                  const status_online_data = {
                    uniqeid: uniqeid,
                    customer_uni_id: array.user_uni_id,
                    astrologer_uni_id: array.astrologer_uni_id,
                    charge: astroPrice,
                    charge_minutes: charge_minutes,
                    duration: 0,
                    status: "queue",
                    call_type: call_type,
                    is_review: is_review,
                    order_date: getConfig("current_date"),
                    waiting_time: second,
                    offer_type: offer_type,
                    is_inapp_voice_call: in_app_voice_call,
                    currency_code: currency_code,
                    currency_symbol: currency_symbol,
                    exchange_rate: exchange_rate,
                  };
                  callHistory = await CallHistory.create(status_online_data);
                }

                let is_token = 1;
                let senddata = {};
                if (
                  getWaitingTime == 0 ||
                  (getWaitingTime > 0 &&
                    is_queue_request &&
                    my_queue_number == 1)
                ) {
                  if (call_type === "call") {
                    if (in_app_voice_call && in_app_voice_call == 1) {
                      const curent_status = callHistory.status;
                      if (
                        (getWaitingTime == 0 && curent_status == "request") ||
                        (getWaitingTime > 0 &&
                          is_queue_request &&
                          curent_status == "queue_request" &&
                          my_queue_number == 1) ||
                        getWaitingTime == 0
                      ) {
                        const arry = {
                          uniqeid: uniqeid,
                          user_uni_id: array.user_uni_id,
                          user_id: customer.id,
                        };
                        const agoraTokenGen = await generateAgoraRtcToken(arry);
                        if (agoraTokenGen.token) {
                          senddata.token = agoraTokenGen.token;
                        } else {
                          is_token = 0;
                        }
                      }
                      if (getWaitingTime == 0 && senddata.token) {
                        await callHistory.update({
                          token: senddata.token,
                          status: "request",
                          waiting_time: second,
                          waiting_for_request: waiting_for_request,
                        });
                      }
                    } else {
                      const check_call_token = await checkCallToken(
                        callHistory.uniqeid
                      );
                      if (check_call_token) {
                        // Note: Cache locking requires a Redis or similar implementation in Node.js
                        const customerNumber = customer.user.phone;
                        const astroPhone = astrologer.user.phone;
                        const custoWhite =
                          await exotelCustomerWhitelistCurl(customerNumber);
                        const astroWhite =
                          await exotelCustomerWhitelistCurl(astroPhone);
                        const CallReq = await exotelCallRequestCurl(
                          astroPhone,
                          customerNumber,
                          second
                        );
                        if (CallReq.Call && CallReq.Call.Sid) {
                          senddata.token = CallReq.Call.Sid;
                          await callHistory.update({
                            token: CallReq.Call.Sid,
                            status: "in-progress",
                            call_start: getConfig("current_datetime"),
                            waiting_time: second,
                          });
                        } else {
                          is_token = 0;
                        }
                      }
                    }
                  }

                  if (getWaitingTime == 0 && call_type === "chat") {
                    await callHistory.update({
                      status: "request",
                      waiting_time: second,
                      waiting_for_request: waiting_for_request,
                    });
                  }

                  if (getWaitingTime == 0 && call_type === "video") {
                    const arry = {
                      uniqeid: uniqeid,
                      user_uni_id: array.user_uni_id,
                      user_id: customer.id,
                    };
                    const agoraTokenGen = await generateAgoraRtcToken(arry);
                    if (agoraTokenGen.token) {
                      senddata.token = agoraTokenGen.token;
                      await callHistory.update({
                        token: agoraTokenGen.token,
                        status: "request",
                        waiting_time: second,
                        waiting_for_request: waiting_for_request,
                      });
                    } else {
                      is_token = 0;
                    }
                  }
                }

                if (is_token) {
                  if (callHistory.uniqeid) {
                    await Astrologer.update(
                      { busy_status: "1" },
                      { where: { astrologer_uni_id: array.astrologer_uni_id } }
                    );
                    senddata.minutes = minutes;
                    senddata.second = second;
                    senddata.uniqeid = uniqeid;
                    senddata.name = astrologer.user.name;

                    if (
                      ["chat", "video"].includes(call_type) ||
                      (call_type === "call" && in_app_voice_call == 1)
                    ) {
                      const curent_status = callHistory.status;
                      if (
                        (getWaitingTime == 0 && curent_status == "request") ||
                        (getWaitingTime > 0 &&
                          is_queue_request &&
                          curent_status == "queue_request" &&
                          my_queue_number == 1)
                      ) {
                        const saveData = {
                          status: "request",
                          waiting_time: second,
                          is_review: is_review,
                          waiting_for_request: waiting_for_request,
                          ivr_count: ivr_count,
                          ivr_start_from: new Date(
                            Date.now() + ivr_after_seconds * 1000
                          )
                            .toISOString()
                            .slice(0, 19)
                            .replace("T", " "),
                        };
                        if (
                          in_app_voice_call == 1 &&
                          senddata.token &&
                          call_type == "call"
                        ) {
                          saveData.token = senddata.token;
                        }
                        await callHistory.update(saveData);

                        if (astrologer.user.user_fcm_token) {
                          const notification_desc =
                            call_type == "chat"
                              ? "You Have a Chat Request ..."
                              : call_type == "video"
                                ? "You Have a Video Call Request ..."
                                : "You Have a Voice Call Request ...";
                          const astroNotify = {
                            title: customer.user.name,
                            description: notification_desc,
                            chunk: [astrologer.user.user_fcm_token],
                            type: call_type,
                            uniqueId: uniqeid || "",
                            customerUniId: customer.customer_uni_id || "",
                            customerName: customer.user.name || "",
                            customerImage: customer.customer_img,
                            channelName: getConfig("company_name"),
                            user_uni_id: array.user_uni_id,
                            astrologer_uni_id: array.astrologer_uni_id,
                            duration: second,
                            start_time: getConfig("current_datetime"),
                            notification_id: callHistory.id,
                          };
                          await sendNotification(astroNotify);
                        }
                      }

                      if (
                        (getWaitingTime == 0 && curent_status == "queue") ||
                        (getWaitingTime > 0 &&
                          is_queue_request &&
                          curent_status == "queue" &&
                          my_queue_number == 1)
                      ) {
                        const saveData = {
                          status: "queue_request",
                          waiting_time: second,
                          is_review: is_review,
                          waiting_for_request: waiting_for_request,
                          ivr_count: ivr_count,
                          ivr_start_from: formatDateTime(
                            new Date(Date.now() + ivr_after_seconds * 1000)
                          ),
                        };

                        await callHistory.update(saveData);

                        if (customer.user.user_fcm_token) {
                          const notification_desc =
                            call_type == "chat"
                              ? "Available For Your Chat ..."
                              : call_type == "video"
                                ? "Available For Your Video Call ..."
                                : "Available For Your Voice Call ...";
                          const customerNotify = {
                            title: astrologer.display_name,
                            description: notification_desc,
                            chunk: [customer.user.user_fcm_token],
                            type: call_type,
                            channelName: getConfig("company_name"),
                            user_uni_id: array.user_uni_id,
                            astrologer_uni_id: array.astrologer_uni_id,
                            duration: second,
                            start_time: getConfig("current_datetime"),
                            // click_action: route("waitingTime"), //i'm skipping this because this route is not use any app
                            notification_id: callHistory.id,
                          };
                          await sendNotification(customerNotify);
                        }
                      }
                    }

                    if (!is_queue_request && callHistory.status == "queue") {
                      if (astrologer.user.user_fcm_token) {
                        const notification_desc =
                          call_type == "chat"
                            ? "Join chat queue."
                            : call_type == "video"
                              ? "Join video call queue."
                              : "Join voice call queue.";
                        const astroNotify = {
                          title: customer.user.name,
                          description: notification_desc,
                          chunk: [astrologer.user.user_fcm_token],
                          type: "android",
                          uniqueId: uniqeid || "",
                          customerUniId: customer.customer_uni_id || "",
                          customerName: customer.user.name || "",
                          customerImage: customer.customer_img,
                          channelName: getConfig("company_name"),
                          user_uni_id: array.user_uni_id,
                          astrologer_uni_id: array.astrologer_uni_id,
                          duration: second,
                          start_time: getConfig("current_datetime"),
                          notification_id: callHistory.id,
                        };
                        await sendNotification(astroNotify);
                      }
                    }

                    const is_virtual_astrologer = astrologer.is_virtual;
                    if (is_virtual_astrologer == 1) {
                      const virtualReqUpdateData = {
                        call_start: new Date()
                          .toISOString()
                          .slice(0, 19)
                          .replace("T", " "),
                        order_date: new Date().toISOString().slice(0, 10),
                        status: "in-progress",
                      };
                      await callHistory.update(virtualReqUpdateData);
                    }

                    if (getWaitingTime) {
                      let msg = "";
                      let status = 0;
                      let join_status = 0;
                      const check_current_status = callHistory.status;

                      if (callHistory.call_type == "chat") {
                        if (
                          ["queue", "queue_request"].includes(
                            check_current_status
                          ) &&
                          is_queue_request
                        ) {
                          msg = `You are already in the chat queue. Please wait, ${astrologer.display_name} will answer you shortly.`;
                          status = 1;
                          join_status = 0;
                        } else if (
                          check_current_status == "request" &&
                          is_queue_request
                        ) {
                          msg = `Your chat request has been sent, ${astrologer.display_name} will join you shortly.`;
                          status = 1;
                          join_status = 1;
                        } else if (check_current_status == "queue") {
                          msg = `Your chat request has been successfully booked. ${astrologer.display_name} will answer you within ${minutesToReadableTime(getWaitingTime)}`;
                          status = 1;
                          join_status = 0;
                          intake_status = 1;
                        }
                      } else if (callHistory.call_type == "video") {
                        if (
                          ["queue", "queue_request"].includes(
                            check_current_status
                          ) &&
                          is_queue_request
                        ) {
                          msg = `You are already in the video call queue. Please wait, ${astrologer.display_name} will answer you shortly.`;
                          status = 1;
                          join_status = 0;
                        } else if (
                          check_current_status == "request" &&
                          is_queue_request
                        ) {
                          msg = `Your video call request has been sent, ${astrologer.display_name} will join you shortly.`;
                          status = 1;
                          join_status = 1;
                        } else if (check_current_status == "queue") {
                          msg = `Your video call request has been successfully booked. ${astrologer.display_name} will answer you within ${minutesToReadableTime(getWaitingTime)}`;
                          status = 1;
                          join_status = 0;
                          intake_status = 1;
                        }
                      } else if (callHistory.call_type == "call") {
                        if (in_app_voice_call && in_app_voice_call == 1) {
                          if (
                            ["queue", "queue_request"].includes(
                              check_current_status
                            ) &&
                            is_queue_request
                          ) {
                            msg = `You are already in the voice call queue. Please wait, ${astrologer.display_name} will answer you shortly.`;
                            status = 1;
                            join_status = 0;
                          } else if (
                            check_current_status == "request" &&
                            is_queue_request
                          ) {
                            msg = `Your voice call request has been sent, ${astrologer.display_name} will join you shortly.`;
                            status = 1;
                            join_status = 1;
                          } else if (check_current_status == "queue") {
                            msg = `Your voice call request has been successfully booked. ${astrologer.display_name} will answer you within ${minutesToReadableTime(getWaitingTime)}`;
                            status = 1;
                            join_status = 0;
                            intake_status = 1;
                          }
                        } else {
                          if (
                            check_current_status == "queue" &&
                            is_queue_request
                          ) {
                            msg = `You are already in the call queue. Please wait, ${astrologer.display_name} will answer you shortly. You will receive a call from: ${getConfig("exotel_caller_id")}`;
                            status = 1;
                            join_status = 0;
                          } else if (check_current_status == "queue") {
                            msg = `Your voice call request has been successfully booked. ${astrologer.display_name} will answer you within ${minutesToReadableTime(getWaitingTime)}. You will receive a call from: ${getConfig("exotel_caller_id")}`;
                            status = 1;
                            join_status = 0;
                            intake_status = 1;
                          }
                        }
                      }

                      result = {
                        status: status,
                        join_status: join_status,
                        intake_status: intake_status,
                        my_queue_number: my_queue_number,
                        data: senddata,
                        msg: msg,
                      };
                    } else {
                      let msg =
                        call_type == "chat"
                          ? `Your chat request has been successfully booked. ${astrologer.display_name} will answer you soon.`
                          : call_type == "video"
                            ? `Your video call request has been successfully booked. ${astrologer.display_name} will answer you soon.`
                            : call_type == "call"
                              ? in_app_voice_call
                                ? `Your voice call request has been successfully booked. ${astrologer.display_name} will answer you soon.`
                                : `Your voice call request has been successfully booked. ${astrologer.display_name} will answer you soon. You will receive a call from: ${getConfig("exotel_caller_id")}`
                              : `Your request has been successfully booked. ${astrologer.display_name} will answer you soon.`;
                      const join_status = 1;
                      result = {
                        status: 1,
                        join_status: join_status,
                        intake_status: intake_status,
                        my_queue_number: my_queue_number,
                        data: senddata,
                        msg: msg,
                      };
                    }
                  } else {
                    await callHistory.update({
                      status: "Declined(Token Cannot Generate)",
                    });
                    await removeBusyStatus(array.astrologer_uni_id);
                    result = {
                      status: 0,
                      msg: "Oops! Cannot generate token. Please try again",
                    };
                  }
                } else {
                  await callHistory.update({
                    status: "Declined(Invalid Unique Id)",
                  });
                  await removeBusyStatus(array.astrologer_uni_id);
                  result = {
                    status: 0,
                    msg: "Something Went wrong. Try Again",
                  };
                }
              } else {
                result = {
                  status: 0,
                  error_code: 102,
                  msg: "You Have Not Sufficent Balance Kindly Recharge",
                };
              }
            } else {
              result = {
                status: 0,
                msg: "Astrologer not available for this service",
              };
            }
          } else {
            result = {
              status: 0,
              msg: `Astrologer is offline for ${call_type}`,
            };
          }
        } else {
          if (astrologer_uni_id) {
            const waitingCustomerData =
              await waitingCustomer(astrologer_uni_id);
            if (waitingCustomerData && waitingCustomerData.call_type) {
              await startCall(
                waitingCustomerData,
                waitingCustomerData.call_type
              );
            }
          }
          result = {
            status: 0,
            msg: "You are already in queue please wait or cancel queue from queue list.",
          };
        }
      } else {
        if (astrologer_uni_id) {
          const waitingCustomerData = await waitingCustomer(astrologer_uni_id);

          if (waitingCustomerData && waitingCustomerData.call_type) {
            await startCall(waitingCustomerData, waitingCustomerData.call_type);
          }
        }
        result = {
          status: 0,
          msg: "You missed this Session (Expired).",
        };
      }
    }
  } else {
    result = {
      status: 0,
      msg: "Please update your app and then re-login",
    };
  }

  charge_for_clevertap = parseFloat(charge_for_clevertap);
  result.charge = charge_for_clevertap;
  return result;
};

///////////////////// getChatRequest functions start /////////////////////

export async function commonDateTimeFormatForApp(date, key = "") {
  if (!date || date === "0000-00-00") {
    return "";
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "";
  }

  const pad = (num) => String(num).padStart(2, "0");

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hourStr = pad(hours);

  if (key === "datetime") {
    return `${day}/${month}/${year} ${hourStr}:${minutes} ${ampm}`;
  } else if (key === "date") {
    return `${day}/${month}/${year}`;
  } else if (key === "time") {
    return `${hourStr}:${minutes} ${ampm}`;
  }

  return "";
}

export async function isRepeated(
  customer_uni_id = "",
  astrologer_uni_id = "",
  uniqeid = ""
) {
  let status = 0;

  if (customer_uni_id && astrologer_uni_id) {
    let callHistory;

    if (uniqeid) {
      callHistory = await CallHistory.findOne({
        where: {
          customer_uni_id,
          astrologer_uni_id,
          uniqeid,
          status: "completed",
        },
      });

      if (callHistory) {
        const callHistoryBefore = await CallHistory.findOne({
          where: {
            customer_uni_id,
            astrologer_uni_id,
            status: "completed",
            created_at: { [Op.lt]: callHistory.created_at },
          },
        });

        if (callHistoryBefore) {
          status = 1;
        }
      }
    } else {
      callHistory = await CallHistory.findOne({
        where: {
          customer_uni_id,
          astrologer_uni_id,
          status: "completed",
        },
      });

      if (callHistory) {
        status = 1;
      }
    }
  }

  return status;
}

// export async function getChatRequest(filter_array) {
//   try {
//     const whereConditions = {
//       call_type: "chat",
//       [Op.or]: [{ status: "request" }, { status: "in-progress" }]
//     };

//     if (filter_array.astrologer_uni_id) {
//       whereConditions.astrologer_uni_id = filter_array.astrologer_uni_id;
//     }

//     if (filter_array.from && filter_array.to) {
//       whereConditions.created_at = {
//         [Op.between]: [filter_array.from, filter_array.to]
//       };
//     }

//     const results = await CallHistory.findAll({
//       where: whereConditions,
//       include: [
//         {
//           model: User,
//           as: "user",
//           attributes: [
//             "phone",
//             "name",
//             "email",
//             "user_fcm_token",
//             "user_ios_token"
//           ],
//           required: false
//         },
//         {
//           model: Customer,
//           as: "customer",
//           attributes: ["customer_img"],
//           required: false
//         }
//       ],
//       order: [["id", "DESC"]],
//       limit: 5
//     });

//     const imgBasePath = path.join(
//       process.cwd(),
//       "public",
//       constants.customer_image_path
//     );

//     const updatedResults = await Promise.all(
//       results.map(async (record) => {
//         const result = record.toJSON();

//         // Handle customer image
//         const custImg = result.customer?.customer_img || "";
//         const fullImgPath = path.join(imgBasePath, custImg);

//         if (custImg && fs.existsSync(fullImgPath)) {
//           result.customer_img = `${constants.base_url}/${constants.customer_image_path}${custImg}`;
//         } else {
//           result.customer_img = `${constants.base_url}/${constants.default_customer_image_path}`;
//         }

//         // Format datetime and add additional fields
//         result.order_datetime = await commonDateTimeFormatForApp(
//           result.created_at,
//           "datetime"
//         );
//         result.max_duration = parseInt(result.waiting_time || 0);
//         result.cust_balance = await getTotalBalanceById(result.customer_uni_id);
//         result.is_repeated = await isRepeated(
//           result.customer_uni_id,
//           result.astrologer_uni_id
//         );

//         return result;
//       })
//     );

//     return updatedResults;
//   } catch (error) {
//     console.error("Error in getChatRequest:", error);
//     return [];
//   }
// }

export async function getChatRequest(filterArray) {
  try {
    const whereConditions = {
      call_type: ["chat"],
      [Op.or]: [{ status: "request" }, { status: "in-progress" }],
    };

    if (filterArray.astrologer_uni_id) {
      whereConditions.astrologer_uni_id = filterArray.astrologer_uni_id;
    }

    if (filterArray.from && filterArray.to) {
      whereConditions.created_at = {
        [Op.between]: [filterArray.from, filterArray.to],
      };
    }

    const res = await CallHistory.findAll({
      where: whereConditions,
      include: [
        {
          model: Intake,
          as: "intake",
        },
        {
          model: User,
          as: "user",
          attributes: [
            "phone",
            "name",
            "email",
            "user_fcm_token",
            "user_ios_token",
            "country_name",
          ],
        },
        {
          model: Customer,
          as: "customer",
          attributes: ["customer_img"],
        },
      ],
      order: [["id", "DESC"]],
      limit: 5,
    });

    if (res && res.length) {
      const imgDir = path.join("public", constants.customer_image_path);
      const defaultImg = `${constants.default_customer_image_path}`;

      for (const record of res) {
        // Flatten user data
        if (record.user) {
          record.dataValues.phone = record.user.phone;
          record.dataValues.name = record.user.name;
          record.dataValues.email = record.user.email;
          record.dataValues.user_fcm_token = record.user.user_fcm_token;
          record.dataValues.user_ios_token = record.user.user_ios_token;
          record.dataValues.country_name = record.user.country_name;
          // Remove the nested user object
          delete record.dataValues.user;
        }

        const custImg = record.customer?.customer_img;

        if (custImg && fs.existsSync(path.join(imgDir, custImg))) {
          record.dataValues.customer_img = `${constants.base_url}/${constants.customer_image_path}${custImg}`;
        } else {
          record.dataValues.customer_img = `${constants.base_url}/${defaultImg}`;
        }

        record.dataValues.order_datetime = commonDateTimeFormatForApp(
          record.created_at,
          "datetime"
        );
        record.dataValues.max_duration = parseInt(record.waiting_time);
        record.dataValues.cust_balance = await getTotalBalanceById(
          record.customer_uni_id
        );
        record.dataValues.is_repeated = await isRepeated(
          record.customer_uni_id,
          record.astrologer_uni_id
        );

        const currency = await getCurrency(record.customer_uni_id, "all");
        record.dataValues.currency_code = currency.currency_code;
        record.dataValues.currency_symbol = currency.currency_symbol;
        record.dataValues.exchange_rate = currency.exchange_rate;
      }
    }

    return res;
  } catch (error) {
    console.error("Error in getChatRequest:", error);
    throw error;
  }
}

///////////////////// getChatRequest functions end /////////////////////

////////////////////// saveChat functions start //////////////////////
export const uploadOtherFiles = async (
  file,
  filePath,
  fileType,
  lastFile = ""
) => {
  try {
    // Ensure file is valid
    if (!file || !file.name) {
      return false;
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    // Delete old file if provided
    if (lastFile) {
      const oldFilePath = path.join(filePath, lastFile);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${fileType}${ext}`;
    const finalPath = path.join(filePath, filename);

    await file.mv(finalPath);

    return filename;
  } catch (err) {
    console.error("File upload error:", err);
    return false;
  }
};

export const uploadImage = async (file, imgPath, imgKey, lastFile = "") => {
  try {
    const smallImgPath = path.join(imgPath, "small");
    const iconImgPath = path.join(imgPath, "icon");

    // Ensure directories exist
    [imgPath, smallImgPath, iconImgPath].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // Remove old files if needed
    if (lastFile) {
      [imgPath, smallImgPath, iconImgPath].forEach((dir) => {
        const filePath = path.join(dir, lastFile);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${imgKey}${ext}`;
    const originalPath = path.join(imgPath, filename);
    const smallPath = path.join(smallImgPath, filename);
    const iconPath = path.join(iconImgPath, filename);

    // Move original file
    await file.mv(originalPath);

    // Create resized versions
    await sharp(originalPath)
      .resize(
        Number(constants.small_image_width || 300),
        Number(constants.small_image_height || 300),
        { fit: "inside" }
      )
      .toFile(smallPath);

    await sharp(originalPath)
      .resize(
        Number(constants.icon_image_width || 100),
        Number(constants.icon_image_height || 100),
        { fit: "inside" }
      )
      .toFile(iconPath);

    return filename;
  } catch (err) {
    console.error("UploadImage error:", err);
    return false;
  }
};

//old code
// export const saveChat = async (attributes) => {
//   const { channel_name, user_uni_id, uniqeid } = attributes;
//   const currdatetime = new Date();

//   const saveData = {
//     channel_name,
//     user_uni_id,
//     status: 1
//   };

//   try {
//     const channel = await ChatChannel.findOne({
//       where: { channel_name },
//       attributes: [
//         "id",
//         "user_uni_id",
//         "channel_name",
//         "status",
//         "created_at",
//         "updated_at"
//       ] // Only select existing columns
//     });

//     if (channel) {
//       await channel.update({
//         trash: 0,
//         updated_at: currdatetime
//       });
//     } else {
//       await ChatChannel.create(saveData);
//     }

//     attributes.status = 1;

//     const created = await ChatChannelHistory.create(attributes);

//     if (created) {
//       return {
//         status: 1,
//         data: created,
//         msg: "create data"
//       };
//     } else {
//       return {
//         status: 0,
//         msg: "Invalid uniqeid"
//       };
//     }
//   } catch (error) {
//     console.error("saveChat error:", error);
//     return {
//       status: 0,
//       msg: "Something went wrong",
//       error: error.message
//     };
//   }
// };

///////////////////// saveChat functions end //////////////

function replacePlaceholders(str, replacements) {
  for (const [key, value] of Object.entries(replacements)) {
    str = str.replace(
      new RegExp(key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "g"),
      value
    );
  }
  return str;
}

export const saveChat = async (attributes) => {
  try {
    const currdatetime = new Date().toISOString().slice(0, 19).replace("T", " ");
    // Initialize variables
    let is_virtual_astrologer = attributes.is_virtual_astrologer || 0;
    let is_virtual_astrologer_first_msg = attributes.is_virtual_astrologer_first_msg || 0;
    let message = attributes.message || "";
    let is_customer_birth_chat = attributes.is_customer_birth_chat || 0;
    let file_url = attributes.file_url || "";
    let slug = attributes.slug || "";
    let lat = attributes.lat || "";
    let lon = attributes.lon || "";
    let tz = attributes.tz || "";
    let user_uni_id = attributes.user_uni_id;
    let uniqeid = attributes.uniqeid;
    let channel_name = attributes.channel_name;
    let is_first_chat = attributes.is_first_chat;
    delete attributes.is_first_chat;
     attributes.updated_at = currdatetime;
    attributes.created_at = currdatetime;
    attributes.is_assistant_chat
    

    // Prepare saveData for channel
    let saveData = {
      channel_name,
      is_assistant_chat: attributes.is_assistant_chat,
      trash: 0,
      updated_at: currdatetime,
    };
    
    let openai_thread_id = "";

    // Find or create channel
    let channel = await ChatChannel.findOne({ where: { channel_name } });

    if (channel && channel.channel_name) {
      openai_thread_id = channel.openai_thread_id || "";
      await channel.update(saveData);
    } else {
      is_customer_birth_chat = 1;
      await ChatChannel.create(saveData);
    }


    // Create history entry
    attributes.status = 1;
    // console.log("attributes:::",attributes);
    
    let create = await ChatChannelHistory.create(attributes);
    // console.log("create::",create);
    
    let result;
    if (create) {
      result = { 
         status: 1,
         data: {
           user_uni_id: create.user_uni_id,
           uniqeid: create.uniqeid,
           channel_name: create.channel_name,
           message: create.message,
           selected_text: create.selected_text || "",
           selected_type: create.selected_type || "",
           message_type: create.message_type || "Text",
           file_url: create.file_url || "",
           call_type: create.call_type || "chat",
           is_assistant_chat: create.is_assistant_chat || 0,
           status: create.status,
           updated_at: create.updated_at,
           created_at: create.created_at,
           id: create.id
         },
         msg: "create data" 
        };

      let chat_channel_name = channel_name;
      let astrologer_uni_id = "";
      let message_channel_name = "";
      let astrologer_name = "AI Astrologer";
      let astrologer_img = `${constants.base_url}${constants.default_astrologer_image_path}`;
      let ai_astrologer_category = "";

      if (create.channel_name) {
        // Extract channel parts
        let parts = create.channel_name.replace(/^.*?\//, "").split("-");
        if (parts[0] && parts[1]) {
          message_channel_name = `CHAT-MESSAGES/${parts[0]}-${parts[1]}/messages`;

          // Fetch astrologer
          let astrologer = await Astrologer.findOne({
            include: [{ model: User, as: "user" }],
            where: { astrologer_uni_id: parts[1] },
          });
          // console.log("astrologer:::::::::",astrologer);

          if (astrologer) {
            ai_astrologer_category = astrologer.ai_astrologer_category;
            is_virtual_astrologer = astrologer.is_virtual;
            astrologer_uni_id = astrologer.astrologer_uni_id;
            astrologer_name = astrologer.display_name || astrologer.name;
            let astro_img = astrologer.astro_img;
            let imgPath = path.join(
              process.cwd(),
              constants.astrologer_image_path
            );

            if (astro_img && fs.existsSync(path.join(imgPath, astro_img))) {
              astrologer_img = `${constants.base_url}/${constants.astrologer_image_path}${astro_img}`;
            }
          }

          // Notifications on first chat
          if (is_first_chat === 0) {
            let customer = await getCustomerById(parts[0]);
            let notification_id = uniqeid.replace(/CALL|CHAT|VIDEO/g, "");
            let message_type = create.message_type;
            let notif_message = create.message;
            let notifi_title = "";
            let notifi_image = "";
            let deeplink_url = "";

            switch (message_type) {
              case "Text":
                break;
              case "Voice":
                notif_message = "Sent you a voice note";
                break;
              case "Image":
                notif_message = "Sent you a photo";
                break;
              case "Product":
              case "Service":
              case "ManualServices":
                let decoded = notif_message ? JSON.parse(notif_message) : null;
                notifi_title = " suggested you a Remedy";
                notif_message = "Suggested a remedy for you.";
                if (decoded) {
                  deeplink_url = decoded.productUrl || "";
                  let productName = decoded.name || "";
                  notif_message = `${productName} is suggested to you by ${astrologer_name}, avail this now.`;
                  notifi_image = file_url;
                }
                break;
              default:
                notif_message = "Suggested a remedy for you.";
            }

            if (
              astrologer &&
              user_uni_id.includes("ASTRO") &&
              customer &&
              customer.user_fcm_token
            ) {
              let astro_img = astrologer.astro_img;
              let imgPath = path.join(
                process.cwd(),
                constants.astrologer_image_path
              );
              if (astro_img && fs.existsSync(path.join(imgPath, astro_img))) {
                astro_img = `${constants.base_url}${constants.astrologer_image_path}${astro_img}`;
              } else {
                astro_img = `${constants.base_url}${constants.default_astrologer_image_path}`;
              }

              let customerNotify = {
                title: `${astrologer.display_name || ""}${notifi_title}`,
                description: notif_message,
                image: notifi_image,
                chunk: [customer.user_fcm_token],
                type: "message",
                channelName: getConfig("company_name"),
                user_uni_id: "",
                astrologer_uni_id: "",
                duration: 0,
                start_time: "",
                click_action: "",
                notification_id,
                cancel_status: 0,
                url: deeplink_url,
                astrologerUniId: astrologer.astrologer_uni_id || "",
                astrologerName: astrologer.display_name || "",
                astrologerImage: astro_img || "",
                channelName: create.channel_name || "",
              };

              await sendNotification(customerNotify);
            } else if (
              customer &&
              customer.name &&
              astrologer &&
              astrologer.user_fcm_token
            ) {
              let astroNotify = {
                title: customer.name,
                description: notif_message,
                chunk: [astrologer.user_fcm_token],
                type: "message",
                channelName: getConfig("company_name"),
                user_uni_id: "",
                astrologer_uni_id: "",
                duration: 0,
                start_time: "",
                notification_id,
                cancel_status: 0,
                url: file_url,
              };
              await sendNotification(astroNotify);
            }
          }
        }
      }

      // Virtual astrologer AI response
      if (is_virtual_astrologer === 1 && message_channel_name && chat_channel_name) {
        let realtime_database = await firebaseRealtimeDbConnection();
        // console.log("realtime_database::",realtime_database);

        if (!realtime_database) {
          return { status: 0, msg: "Database connection failed" };
        }

        let open_ai_message = "";

        if (is_first_chat === 1) {
          open_ai_message = getConfig("virtual_astrologer_first_message");
        } else {
          let ai_system_prompt = getConfig("ai_system_prompt");
          let ai_user_prompt = getConfig("ai_user_prompt");
          if (ai_astrologer_category) {
            ai_system_prompt = getConfig(
              `ai_system_prompt_${ai_astrologer_category}`
            );
          }

          let is_send_kundali_data = 0;
          let open_ai_assistant_id = getConfig("open_ai_assistant_id");
          if (open_ai_assistant_id) {
            let check_chat_count = await ChatChannelHistory.count({
              where: { channel_name: chat_channel_name, user_uni_id, uniqeid },
            });
            if (check_chat_count === 2) is_send_kundali_data = 1;
            else if (check_chat_count > 2)
              ai_user_prompt = getConfig("ai_user_prompt_after_first_msg");
            if (!openai_thread_id) is_send_kundali_data = 1;
          } else {
            is_send_kundali_data = 1;
          }

          if (is_send_kundali_data === 1) {
            const chat_birth_details =
              (
                await realtime_database
                  .ref(`${chat_channel_name}/birth`)
                  .once("value")
              ).val() || {};
            const formatted_chat_birth_details =
              `Name: ${chat_birth_details.name || ""}\n` +
              `Gender: ${chat_birth_details.gender || ""}\n` +
              `Date of Birth: ${chat_birth_details.dob || ""}\n` +
              `Time of Birth: ${chat_birth_details.tob || ""}\n` +
              `Place of Birth: ${chat_birth_details.pob || ""}\n` +
              `Latitude: ${chat_birth_details.latitude || ""}\n` +
              `Longitude: ${chat_birth_details.longitude || ""}`;

            const cust_data = {
              name: chat_birth_details.name || "",
              gender: chat_birth_details.gender || "",
              dob: chat_birth_details.dob || "",
              tob: chat_birth_details.tob || "",
              pob: chat_birth_details.pob || "",
              lat: chat_birth_details.latitude || "",
              lon: chat_birth_details.longitude || "",
              tz: chat_birth_details.time_zone || "",
              lang: "English",
            };

            let astrology_api_response = "";
            let kp_kundali = "";
            let prashna_kundali = "";
            let mahadasha = "";
            let doshas = "";
            let bhav_chalit = "";
            let western_planets = "";
            let varshapala = "";

            if (ai_system_prompt.includes("#KUNDALI#")) {
              const kundali_data = await generateVedicAstroAIKundali(cust_data);
              if (kundali_data)
                astrology_api_response = JSON.stringify(kundali_data, null, 2);
            }
            if (ai_system_prompt.includes("#KP_KUNDALI#")) {
              const kp_data = await generateVedicAstroKPKundali(cust_data);
              if (kp_data) kp_kundali = JSON.stringify(kp_data, null, 2);
            }
            if (ai_system_prompt.includes("#PRASHNA_KUNDALI#")) {
              const prashna_data = await generateVedicAstroPrashnaKundali({
                ...cust_data,
                lat,
                lon,
                tz,
              });
              if (prashna_data)
                prashna_kundali = JSON.stringify(prashna_data, null, 2);
            }
            if (ai_system_prompt.includes("#MAHADASHA#")) {
              const mahadasha_data =
                await generateVedicAstroCurrentMahadashaFullKundali(cust_data);
              if (mahadasha_data)
                mahadasha = JSON.stringify(mahadasha_data, null, 2);
            }
            if (ai_system_prompt.includes("#DOSHAS#")) {
              const doshas_data =
                await generateVedicAstroDoshasKundali(cust_data);
              if (doshas_data) doshas = JSON.stringify(doshas_data, null, 2);
            }
            if (ai_system_prompt.includes("#BHAV_CHALIT#")) {
              const bhav_chalit_data =
                await generateVedicAstroBhavChalitKundali(cust_data);
              if (bhav_chalit_data)
                bhav_chalit = JSON.stringify(bhav_chalit_data, null, 2);
            }
            if (ai_system_prompt.includes("#WESTERN_PLANETS#")) {
              const western_planets_data =
                await generateVedicAstroWesternPlanetsKundali(cust_data);
              if (western_planets_data)
                western_planets = JSON.stringify(western_planets_data, null, 2);
            }
            if (ai_system_prompt.includes("#VARSHAPALA#")) {
              const varshapala_data =
                await generateVedicAstroVarshapalDetailsKundali(cust_data);
              if (varshapala_data)
                varshapala = JSON.stringify(varshapala_data, null, 2);
            }

            const aiAstrologerPromptVar = {
              "#MESSAGE#": message || "",
              "#KUNDALI#": astrology_api_response || "",
              "#USERDETAILS#": formatted_chat_birth_details || "",
              "#KP_KUNDALI#": kp_kundali || "",
              "#PRASHNA_KUNDALI#": prashna_kundali || "",
              "#MAHADASHA#": mahadasha || "",
              "#DOSHAS#": doshas || "",
              "#BHAV_CHALIT#": bhav_chalit || "",
              "#WESTERN_PLANETS#": western_planets || "",
              "#VARSHAPALA#": varshapala || "",
            };

            const aiAstrologerPromptVarRemove = {
              "#MESSAGE#": "",
              "#KUNDALI#": "",
              "#USERDETAILS#": "",
              "#KP_KUNDALI#": "",
              "#PRASHNA_KUNDALI#": "",
              "#MAHADASHA#": "",
              "#DOSHAS#": "",
              "#BHAV_CHALIT#": "",
              "#WESTERN_PLANETS#": "",
              "#VARSHAPALA#": "",
            };

            if (open_ai_assistant_id) {
              ai_system_prompt = replacePlaceholders(
                ai_system_prompt,
                aiAstrologerPromptVarRemove
              );
            } else {
              ai_system_prompt = replacePlaceholders(
                ai_system_prompt,
                aiAstrologerPromptVar
              );
            }
            ai_user_prompt = replacePlaceholders(
              ai_user_prompt,
              aiAstrologerPromptVar
            );

            if (open_ai_assistant_id) {
              // const open_ai = new OpenAI();
              if (!openai_thread_id) {
                openai_thread_id = await open_ai.createThread();
                if (channel && channel.channel_name) {
                  await channel.update({ openai_thread_id });
                }
              }
              if (openai_thread_id) {
                await open_ai.sendMessageToThread(
                  openai_thread_id,
                  ai_user_prompt
                );
                const run_id = await open_ai.runAssistantOnThread(
                  openai_thread_id,
                  open_ai_assistant_id,
                  ai_system_prompt
                );
                let run_status;
                do {
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                  run_status = await open_ai.getRunStatus(
                    openai_thread_id,
                    run_id
                  );
                } while (run_status.status !== "completed");
                const open_ai_message_resp =
                  await open_ai.getThreadMessages(openai_thread_id);
                open_ai_message = open_ai_message_resp[0]?.text?.value || "";
              }
            } else {
              const query = {
                // model: "gpt-3.5-turbo",
                // model: "gpt-4o",
                model: "gpt-4-turbo",
                messages: [
                  { role: "system", content: ai_system_prompt },
                  { role: "user", content: ai_user_prompt },
                ],
                temperature: 0.9,
                max_tokens: 2048,
              };
              // const open_ai = new OpenAI();
              const data = await open_ai.completions(query);
              open_ai_message = data.choices[0]?.message?.content || "";
            }
          }
        }

        if (open_ai_message) {
          if (realtime_database) {
            const pushMessageData = {
              senderUniId: astrologer_uni_id,
              name: astrologer_name,
              text: open_ai_message,
              profileImageUrl: astrologer_img,
              date: new Date().toISOString().slice(0, 19).replace("T", " "),
              fileUrl: "",
              selectedText: "",
              selectedType: "",
              messageType: "Text",
            };
            await realtime_database
              .ref(message_channel_name)
              .push(pushMessageData);
          }

          if (is_virtual_astrologer_first_msg !== 1 && astrologer_uni_id) {
            const ai_astrologer_chat_history_data = {
              user_uni_id: astrologer_uni_id,
              uniqeid,
              channel_name: chat_channel_name,
              message: open_ai_message,
              selected_text: "",
              selected_type: "",
              file_url: "",
              message_type: "Text",
              call_type: "chat",
              is_assistant_chat: 0,
              status: 1,
              created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
              updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
            };
            // console.log("ai_astrologer_chat_history_data:::",ai_astrologer_chat_history_data);

            await ChatChannelHistory.create(ai_astrologer_chat_history_data);
          }
        }
      }
    } else {
      result = { status: 0, msg: "Invalid uniqeid" };
    }
    // console.log("result:::::",result);

    return result;
  } catch (error) {
    console.error("Error in saveChat:", error);
    return { status: 0, msg: "An error occurred" };
  }
};

export const remainingChatTimeForCustomer = async (uniqeid = "") => {
  let result = {
    display_name: "",
    call_status: "",
    remaining_time_in_second: 0,
    minutes: 0,
  };

  if (!uniqeid) return result;

  const callHistory = await CallHistory.findOne({
    where: {
      uniqeid,
      status: {
        [Op.in]: ["queue", "queue_request", "request", "in-progress"],
      },
    },
    include: [
      {
        model: User,
        attributes: ["name"],
        required: false,
        on: {
          "$User.user_uni_id$": {
            [Op.eq]: Sequelize.col("call_history.astrologer_uni_id"),
          },
        },
      },
      {
        model: Astrologer,
        attributes: ["display_name"],
        required: false,
      },
    ],
  });

  if (callHistory) {
    const call_status = callHistory.status;
    const display_name = callHistory.Astrologer?.display_name || "";

    let remaining_time_in_second = 0;
    let minutes = 0;

    if (
      callHistory.call_type === "chat" &&
      ["in-progress", "request", "queue_request"].includes(call_status)
    ) {
      if (call_status === "in-progress") {
        const currentTime = moment();
        const chatStartTime = moment(callHistory.call_start);
        const timeDifference = currentTime.diff(chatStartTime, "seconds");
        const totalTimeInSeconds = callHistory.waiting_time || 0;
        remaining_time_in_second = totalTimeInSeconds - timeDifference;
      } else {
        remaining_time_in_second = callHistory.waiting_time || 0;
      }

      if (remaining_time_in_second > 0) {
        minutes = Math.round((remaining_time_in_second / 60) * 100) / 100;
      } else {
        remaining_time_in_second = 0;
      }
    }

    result = {
      display_name,
      call_status,
      remaining_time_in_second,
      minutes,
    };
  }

  return result;
};

export const first_call_free_minutes_text = async (minutes) => {
  const prefix = await getConfig("first_call_free_minute_prefix");
  const suffix = await getConfig("first_call_free_minute_suffix");
  return `${prefix} ${minutes} ${suffix}`;
};

export const checkCallDetail = async (
  astrologer_uni_id,
  call_type,
  user_uni_id,
  uniqeid = null
) => {
  try {
    let result = {};
    const customer = await User.findOne({ where: { user_uni_id } });

    if (customer) {
      const currency = await getCurrency(customer.phone);

      const astrodataRaw = await Astrologer.findOne({
        where: { astrologer_uni_id },
        subQuery: false,
        include: [
          {
            model: AstrologerPrice,
            as: "prices",
            where: { type: call_type, currency },
            required: true,
            attributes: [],
          },
          {
            model: CallHistory,
            as: "call_history",
            where: {
              status: {
                [Op.in]: ["queue", "request", "in-progress", "queue_request"],
              },
            },
            required: false,
            attributes: [],
          },
        ],
        attributes: [
          [Sequelize.literal("prices.price"), "price"],
          [Sequelize.literal("prices.time_in_minutes"), "time"],
          "busy_status",
          [
            Sequelize.fn(
              "IFNULL",
              Sequelize.col("call_history.waiting_time"),
              0
            ),
            "total_waiting_time",
          ],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.literal("IF(call_history.waiting_time>0,1,0)")
            ),
            "total_queue_count",
          ],
        ],
        group: [
          Sequelize.literal("astrologers.astrologer_uni_id"),
          Sequelize.literal("prices.price"),
          Sequelize.literal("prices.time_in_minutes"),
          "busy_status",
        ],
      });

      let astrodata = astrodataRaw?.dataValues;

      if (astrodata && astrodata.price > 0) {
        let actual_price = 0;
        let is_offer_applied = 0;
        let first_call_offer = await getConfig("first_call_offer");
        const checkOffer =
          await checkAstroOfferAfterLimitExceed(astrologer_uni_id);

        if (checkOffer && !isNaN(checkOffer) && checkOffer > 0) {
          first_call_offer = checkOffer;
        }

        const first_call_price = await getConfig("first_call_price_per_min");
        const first_call_free_minutes = await getConfig(
          "first_call_free_minutes"
        );
        let first_call_free_minutes_txt = "";

        if (user_uni_id) {
          const isFirstCall = await isFirstUser(user_uni_id, astrologer_uni_id);

          if (!isFirstCall && first_call_offer) {
            if (
              first_call_offer === "2" &&
              first_call_price > 0 &&
              low_price_offer_on().includes(call_type)
            ) {
              actual_price = astrodata.price;
              astrodata.price = first_call_price;
              is_offer_applied = 1;
            } else if (first_call_offer === "3") {
              const freeLimitOk =
                await checkAstroOfferCallLimitAllow(astrologer_uni_id);
              const allowFixed =
                (await getConfig(
                  "fixed_amount_to_astrologer_after_limit_exceed"
                )) == 1;

              if (
                first_call_free_minutes > 0 &&
                free_minutes_offer_on().includes(call_type) &&
                (freeLimitOk || allowFixed)
              ) {
                first_call_free_minutes_txt = first_call_free_minutes_text(
                  first_call_free_minutes
                );
                actual_price = astrodata.price;
                is_offer_applied = 1;
              }
            }
          }

          if (!uniqeid) {
            uniqeid = await alreadySentRequestUniqeid(user_uni_id);
          }
        }

        if (is_offer_applied === 0) {
          const astroDiscount = await getAstroDiscount(astrologer_uni_id);
          if (astroDiscount) {
            actual_price = astrodata.price;
            astrodata.price = await getAstroDiscountedPrice(
              astrologer_uni_id,
              astrodata.price,
              astroDiscount.discount_percent
            );
          }
        }

        let intake_form = 0;
        let im_in_queue = 0;
        let my_queue_number = 0;
        let my_queue_status = 0;
        let is_chat_in_progress = 0;
        let in_progress_data = [];
        let my_requested_astrologer_uni_id = "";

        const waitings_number = await getCustomerQueueList(user_uni_id);
        if (waitings_number?.length > 0) {
          im_in_queue = 1;
          for (let wait of waitings_number) {
            if (wait.uniqeid === uniqeid) {
              my_queue_number = wait.my_queue_number;
              my_requested_astrologer_uni_id = wait.astrologer_uni_id;
              my_queue_status = wait.status;

              if (
                my_requested_astrologer_uni_id === astrologer_uni_id &&
                my_queue_status !== "queue"
              ) {
                const remaining_result =
                  await remainingChatTimeForCustomer(uniqeid);
                if (remaining_result?.remaining_time_in_second > 0) {
                  in_progress_data = {
                    minutes: remaining_result.minutes,
                    second: remaining_result.remaining_time_in_second,
                    uniqeid,
                    name: remaining_result.display_name,
                  };
                  is_chat_in_progress = 1;
                }
              }
              break;
            }
          }
        }

        const user_wallet_amt = await getTotalBalanceById(user_uni_id);
        const minutes = await availableMinuteCalculat(
          astrodata.price,
          astrodata.time,
          user_wallet_amt,
          user_uni_id,
          call_type,
          "",
          astrologer_uni_id
        );

        const second = minutes * 60;

        astrodata = {
          ...astrodata,
          second,
          minutes,
          calltype: call_type,
          user_wallet_amt,
          total_waiting_time: String(
            secondToTime(astrodata.total_waiting_time)
          ),
          im_in_queue,
          my_queue_number,
          my_queue_status,
          first_call_free_minutes: first_call_free_minutes_txt,
          price: parseFloat(astrodata.price),
          my_requested_astrologer_uni_id,
          intake_form:
            im_in_queue === 1 &&
            my_queue_number === 1 &&
            astrologer_uni_id === my_requested_astrologer_uni_id &&
            my_queue_status === "queue_request"
              ? 1
              : 0,
          in_progress_data,
          is_chat_in_progress,
          total_queue_count: String(astrodata.total_queue_count),
        };

        if (actual_price > 0) {
          astrodata.actual_price = parseFloat(actual_price);
        }

        result = {
          status: 1,
          msg: "Get Detail",
          data: astrodata,
          uniqeid,
        };
      } else {
        result = {
          status: 0,
          msg: "Price not set by Astrologer. Please contact the administrator for assistance",
        };
      }
    } else {
      result = {
        status: 0,
        msg: "Invalid Customer Data",
      };
    }

    return result;
  } catch (error) {
    console.error("Error in checkCallDetail:", error);
    return {
      status: 0,
      msg: "An error occurred while processing your request",
    };
  }
};

export const getChatChannelHistory = async (req) => {
  try {
    const page = req.page || 1;
    const page_limit = constants.chat_api_page_limit || 20;
    const offset = (page - 1) * page_limit;

    const whereClause = {
      ...(req.first_msg_id && { id: { [Op.lte]: req.first_msg_id } }),
      ...(req.channel_name && { channel_name: req.channel_name }),
    };

    if (req.user_uni_id && req.user_uni_id.includes("CUS")) {
      whereClause.trash = 0;
    }

    const results = await ChatChannelHistory.findAll({
      where: whereClause,
      offset,
      limit: page_limit,
      order: [["id", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          required: false,
          attributes: ["name", "user_uni_id"],
        },
        {
          model: Astrologer,
          as: "astrologer",
          required: false,
          attributes: ["display_name", "astro_img", "astrologer_uni_id"],
        },
        {
          model: Customer,
          as: "customer",
          required: false,
          attributes: ["customer_img", "customer_uni_id"],
        },
      ],
      raw: true,
      nest: true,
    });

    const chat_channels = results.map((row) => {
      const isAstro = row.user_uni_id.includes("ASTRO");
      const customerImgPath = path.join(
        process.cwd(),
        "public",
        constants.customer_image_path,
        row.customer?.customer_img || ""
      );
      const astroImgPath = path.join(
        process.cwd(),
        "public",
        constants.astrologer_image_path,
        row.astrologer?.astro_img || ""
      );

      const hasCustomerImg =
        row.customer?.customer_img && fs.existsSync(customerImgPath);
      const hasAstroImg =
        row.astrologer?.astro_img && fs.existsSync(astroImgPath);

      const imageUrl = isAstro
        ? hasAstroImg
          ? `${constants.base_url}${constants.astrologer_image_path}${row.astrologer.astro_img}`
          : `${constants.base_url}${constants.default_astrologer_image_path}`
        : hasCustomerImg
          ? `${constants.base_url}${constants.customer_image_path}${row.customer.customer_img}`
          : `${constants.base_url}${constants.default_customer_image_path}`;

      return {
        ...row,
        user_name: isAstro ? row.astrologer?.display_name : row.user?.name,
        user_image_url: imageUrl,
        parent_id: row.parent_id || "",
        selected_text: row.selected_text || "",
      };
    });

    return chat_channels;
  } catch (error) {
    console.error("getChatChannelHistory error:", error);
    throw error;
  }
};

export const inProgressIntakeDetailForAstrologer = async (
  astrologerUniId = ""
) => {
  if (!astrologerUniId) return {};

  const callRecord = await CallHistory.findOne({
    where: {
      astrologer_uni_id: astrologerUniId,
      status: ["request", "in-progress"],
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["name"],
        required: false,
      },
      {
        model: Customer,
        as: "customer",
        attributes: ["customer_img"],
        required: false,
      },
    ],
    order: [["id", "ASC"]],
  });

  if (!callRecord) return {};

  const uniqeid = callRecord.uniqeid;

  const intakeDetails = await Intake.findOne({ where: { uniqeid } });

  if (!intakeDetails) return {};

  // Format customer image URL
  let customer_img = callRecord.customer?.customer_img || "";
  const imgPath = path.join(
    process.cwd(),
    "public",
    constants.customer_image_path
  );

  const fullImgPath = path.join(imgPath, customer_img);
  let customer_img_url;

  if (customer_img && fs.existsSync(fullImgPath)) {
    customer_img_url = `${constants.base_url}${constants.customer_image_path}${customer_img}`;
  } else {
    customer_img_url = `${constants.base_url}${constants.default_customer_image_path}`;
  }

  return {
    ...intakeDetails.dataValues,
    status: callRecord.status,
    call_type: callRecord.call_type,
    cust_name: callRecord.user?.name || "",
    cust_image: customer_img_url,
    available_duration: callRecord.waiting_time,
  };
};

export const getByToken = async (token = null) => {
  if (!token) return null;
  const data = await CallHistory.findOne({ where: { token } });
  return data;
};

///////////////////////////////   videocall  functions start  //////////////////////////

export async function getVideoCallRequest(filter_array) {
  try {
    const whereConditions = {
      call_type: "video",
      [Op.or]: [{ status: "request" }, { status: "in-progress" }],
    };

    if (filter_array.from || filter_array.to) {
      whereConditions.created_at = {
        [Op.between]: [filter_array.from, filter_array.to],
      };
    }

    if (filter_array.astrologer_uni_id) {
      whereConditions.astrologer_uni_id = filter_array.astrologer_uni_id;
    }

    const res = await CallHistory.findAll({
      where: whereConditions,
      include: [
        {
          model: Intake,
          as: "intake",
        },
        {
          model: User,
          as: "user",
          attributes: [
            "phone",
            "name",
            "email",
            "user_fcm_token",
            "user_ios_token",
            "country_name",
          ],
        },
        {
          model: Customer,
          as: "customer",
          attributes: ["customer_img"],
        },
      ],
      order: [["id", "DESC"]],
      limit: 5,
    });

    const APP_URL = `${filter_array.protocol}://${filter_array.host}`;
    const imgPath = path.join(
      __dirname,
      "../public",
      constants.customer_image_path
    );
    const defaultImage = constants.default_customer_image_path;

    for (const val of res) {
      const cust_img = val.customer?.customer_img || "";
      const fullImagePath = path.join(imgPath, cust_img);
      val.dataValues.customer_img =
        cust_img && fs.existsSync(fullImagePath)
          ? `${APP_URL}/${constants.customer_image_path}${cust_img}`
          : `${APP_URL}/${defaultImage}`;

      val.dataValues.order_datetime = commonDateTimeFormatForApp(
        val.created_at,
        "datetime"
      );
      val.dataValues.max_duration = parseInt(val.waiting_time, 10);
      val.dataValues.cust_balance = await getTotalBalanceById(
        val.customer_uni_id
      );
      val.dataValues.is_repeated = await isRepeated(
        val.customer_uni_id,
        val.astrologer_uni_id
      );

      const currency_detail = await getCurrency(val.customer_uni_id, "all");
      val.dataValues.currency_code = currency_detail.currency_code;
      val.dataValues.currency_symbol = currency_detail.currency_symbol;
      val.dataValues.exchange_rate = currency_detail.exchange_rate;
    }

    return res;
  } catch (error) {
    console.error("getVideoCallRequest error:", error);
    return [];
  }
}

export const declineVideoCallRequest = async (uniqeid = "", status = "") => {
  const result = { status: 0, msg: "Already Ended." };

  if (!uniqeid) return result;

  const call = await CallHistory.findOne({
    where: {
      uniqeid,
      status: {
        [Op.in]: ["queue", "queue_request", "request"],
      },
    },
  });

  if (!call) return result;

  await CallHistory.update(
    { status },
    {
      where: { uniqeid },
    }
  );

  await removeBusyStatus(call.astrologer_uni_id);

  const customer = await getCustomerById(call.customer_uni_id);

  const astrologer = await Astrologer.findOne({
    where: { astrologer_uni_id: call.astrologer_uni_id },
    include: [
      {
        model: User,
        as: "user",
        where: { user_uni_id: call.astrologer_uni_id },
      },
    ],
  });

  const companyName = getCompanyName();
  const currentDatetime = getCurrentDatetime(); // function returning current datetime string
  const callId = call.id;

  if (["Declined(Customer)", "Declined(User)"].includes(status)) {
    const astroNotify = {
      title: customer.name,
      description: "Video Call Declined by Customer",
      chunk: [astrologer?.user?.user_fcm_token || ""],
      type: "cancel",
      channelName: companyName,
      user_uni_id: call.customer_uni_id,
      astrologer_uni_id: call.astrologer_uni_id,
      duration: 0,
      start_time: currentDatetime,
      notification_id: callId,
      cancel_status: 1,
    };

    await sendNotification(astroNotify);
  }

  if (["Declined(Astrologer)", "Declined(User)"].includes(status)) {
    const customerNotify = {
      title: astrologer?.user?.display_name || "Astrologer",
      description: "Video Call Declined by Astrologer",
      chunk: [customer.user_fcm_token],
      type: "cancel",
      channelName: companyName,
      user_uni_id: call.customer_uni_id,
      astrologer_uni_id: call.astrologer_uni_id,
      duration: 0,
      start_time: currentDatetime,
      click_action: "/waitingTime", // Or route() if dynamic route helper exists
      notification_id: callId,
      cancel_status: 1,
    };

    await sendNotification(customerNotify);
  }

  return {
    status: 1,
    msg: "Success",
  }

};

export const applySearchFilter = (whereClause, includeArray, search) => {
  if (search && search.trim() !== '') {
    const keyword = `%${search.trim()}%`;

    // Wrap the OR conditions in the main whereClause using Sequelize.literal OR Op.or
    whereClause[Op.or] = [
      // Astrologer.display_name
      { display_name: { [Op.like]: keyword } },

      // users.name or users.phone
      Sequelize.literal(`EXISTS (
        SELECT 1 FROM users 
        WHERE users.user_uni_id = astrologers.astrologer_uni_id 
          AND (users.name LIKE '${keyword}' OR users.phone LIKE '${keyword}')
      )`),

      // skills.skill_name
      Sequelize.literal(`EXISTS (
        SELECT 1 FROM astrologer_skills 
        JOIN skills ON skills.id = astrologer_skills.skill_id 
        WHERE astrologer_skills.astrologer_id = astrologers.id 
          AND skills.skill_name LIKE '${keyword}'
      )`)
    ];

    // Include models, but no filtering here to avoid narrowing results
    includeArray.push({
      model: User,
      as: 'users',
      required: false
    });

    includeArray.push({
      model: Skill,
      as: 'skills',
      required: false,
      through: { attributes: [] }
    });
  }
};
export const applyAstrologerFilters = (body = {}, whereClause, includeArray) => {
  
  // Gender filter
  if (body.gender && body.gender !== '') {
    whereClause.gender = body.gender;
  }

  // Phone filter via user relation
  if (body.phone && body.phone !== '') {
    includeArray.push({
      model: User,
      as: 'users',
      required: true,
      where: {
        phone: body.phone
      }
    });
  }

  // Category filter
  if (body.category && body.category.length > 0) {
    let category = body.category;

    if (typeof category === 'string') {
      try {
        category = category.replace(/\[|\]/g, '').replace(/\s/g, '').split(',').map(Number);
      } catch (e) {
        category = [];
      }
    }

    if (Array.isArray(category) && category.length > 0) {
      includeArray.push({
        model: Category,
        as: 'categories',
        required: true,
        through: { attributes: [] },
        where: {
          id: { [Op.in]: category }
        }
      });
    }
  }

  // Language filter
  if (body.language && body.language.length > 0) {
    let language = body.language;

    if (typeof language === 'string') {
      try {
        language = language.replace(/\[|\]/g, '').replace(/\s/g, '').split(',').map(Number);
      } catch (e) {
        language = [];
      }
    }

    if (Array.isArray(language) && language.length > 0) {
      includeArray.push({
        model: Language,
        as: 'languages',
        required: true,
        through: { attributes: [] },
        where: {
          id: { [Op.in]: language }
        }
      });
    }
  }

  // Skill filter
  if (body.skill && body.skill.length > 0) {
    let skill = body.skill;

    if (typeof skill === 'string') {
      try {
        skill = skill.replace(/\[|\]/g, '').replace(/\s/g, '').split(',').map(Number);
      } catch (e) {
        skill = [];
      }
    }

    if (Array.isArray(skill) && skill.length > 0) {
      includeArray.push({
        model: Skill,
        as: 'skills',
        required: true,
        through: { attributes: [] },
        where: {
          id: { [Op.in]: skill }
        }
      });
    }
  }
};

export const applyAstrologerSortQuery = (body = {}, orderArray, includeArray,whereClause = {}) => {
  const sortby = body.sortby;
  // ✅ Apply astrologer availability type filter
  if (body.type) {
    switch (body.type) {
      case 'chat':
        whereClause.chat_status = 1;
        break;
      case 'call':
        whereClause.call_status = 1;
        break;
      case 'video':
        whereClause.video_status = 1;
        break;
      case 'live':
        whereClause.live_status = 1;
        // Optional: add expiry check if you have live_expire column
        whereClause.live_expire = {
          [Op.gt]: new Date(), // assumes current datetime
        };
        break;
    }
  }

  const priceType = ['chat', 'call', 'video', 'videocallwithlive'].includes(body.type)
    ? body.type
    : 'chat'; // default to 'chat' if not valid

  if (!sortby) return;

  switch (sortby) {
    case 'latest':
      includeArray.push({
        model: User,
        as: 'users',
        required: false,
        attributes: []
      });
      orderArray.push([col('users.created_at'), 'DESC']);
      break;

    case 'rating':
      orderArray.push([
        literal(`(
          SELECT u.avg_rating
          FROM users u
          WHERE u.user_uni_id = astrologers.astrologer_uni_id
          LIMIT 1
        )`),
        'DESC'
      ]);
      break;

case 'price-desc':
   orderArray.push([
    literal(`(
      SELECT CAST(ap.price AS DECIMAL(10,2))
      FROM astrologer_prices ap
      WHERE ap.astrologer_uni_id = astrologers.astrologer_uni_id
        AND ap.type = '${priceType}'
        AND ap.trash = 0
        AND ap.price IS NOT NULL
      ORDER BY CAST(ap.price AS DECIMAL(10,2)) ASC
      LIMIT 1
    )`),
    'DESC'
  ]);
  break;

case 'price-asc':
  orderArray.push([
    literal(`(
      SELECT CAST(ap.price AS DECIMAL(10,2))
      FROM astrologer_prices ap
      WHERE ap.astrologer_uni_id = astrologers.astrologer_uni_id
        AND ap.type = '${priceType}'
        AND ap.trash = 0
        AND ap.price IS NOT NULL
      ORDER BY CAST(ap.price AS DECIMAL(10,2)) ASC
      LIMIT 1
    )`),
    'ASC'
  ]);
  break;


    case 'experience-asc':
      orderArray.push(['experience', 'ASC']);
      break;

    case 'experience-desc':
      orderArray.push(['experience', 'DESC']);
      break;

    case 'free-offer':
      includeArray.push({
        model: CallHistory,
        as: 'call_history',
        required: false,
        attributes: [],
        where: {
          offer_type: { [Op.in]: [2, 3] },
          status: 'completed'
        }
      });
      orderArray.push([
        literal(`(
          SELECT COUNT(*) 
          FROM call_histories 
          WHERE call_histories.astrologer_uni_id = astrologers.astrologer_uni_id 
            AND call_histories.status = 'completed' 
            AND call_histories.offer_type IN (2, 3)
        )`),
        'DESC'
      ]);
      break;

    case 'trending':
      orderArray.push([
        literal(`(
          SELECT COUNT(*) 
          FROM call_histories 
          WHERE call_histories.astrologer_uni_id = astrologers.astrologer_uni_id 
            AND call_histories.status = 'completed'
        )`),
        'DESC'
      ]);
      break;

    default:
      break;
  }
};

export const applyAstrologerSequenceOrder = (orderArray) => {
  // Prioritize online astrologers with availability using sort_by field
//   orderArray.push([
//   literal(`CASE
//     WHEN astrologers.online_status = 1 AND 
//          (astrologers.call_status = 1 OR astrologers.chat_status = 1 OR astrologers.video_status = 1) 
//     THEN astrologers.sort_by
//     ELSE NULL
//   END`),
//   'DESC'
// ]);


  // Complex priority sequence based on availability and busy status
  orderArray.push([
    literal(`CASE
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 0 AND astrologers.call_status = 1 AND astrologers.chat_status = 1 AND astrologers.video_status = 1 THEN 1
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 0 AND astrologers.call_status = 1 AND astrologers.chat_status = 1 AND astrologers.video_status = 0 THEN 2
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 0 AND astrologers.call_status = 1 AND astrologers.chat_status = 0 AND astrologers.video_status = 1 THEN 3
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 0 AND astrologers.call_status = 0 AND astrologers.chat_status = 1 AND astrologers.video_status = 1 THEN 4
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 0 AND astrologers.call_status = 0 AND astrologers.chat_status = 0 AND astrologers.video_status = 1 THEN 5
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 0 AND astrologers.call_status = 1 AND astrologers.chat_status = 0 AND astrologers.video_status = 0 THEN 6
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 0 AND astrologers.call_status = 0 AND astrologers.chat_status = 1 AND astrologers.video_status = 0 THEN 7

      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 1 AND astrologers.call_status = 1 AND astrologers.chat_status = 1 AND astrologers.video_status = 1 THEN 8
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 1 AND astrologers.call_status = 1 AND astrologers.chat_status = 1 AND astrologers.video_status = 0 THEN 9
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 1 AND astrologers.call_status = 1 AND astrologers.chat_status = 0 AND astrologers.video_status = 1 THEN 10
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 1 AND astrologers.call_status = 0 AND astrologers.chat_status = 1 AND astrologers.video_status = 1 THEN 11
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 1 AND astrologers.call_status = 0 AND astrologers.chat_status = 0 AND astrologers.video_status = 1 THEN 12
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 1 AND astrologers.call_status = 1 AND astrologers.chat_status = 0 AND astrologers.video_status = 0 THEN 13
      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 1 AND astrologers.call_status = 0 AND astrologers.chat_status = 1 AND astrologers.video_status = 0 THEN 14

      WHEN astrologers.online_status = 1 AND astrologers.busy_status = 0 AND astrologers.call_status = 0 AND astrologers.chat_status = 0 AND astrologers.video_status = 0 THEN 15
      WHEN astrologers.online_status = 0 AND astrologers.busy_status = 1 AND astrologers.call_status = 0 AND astrologers.chat_status = 0 AND astrologers.video_status = 0 THEN 16
      WHEN astrologers.online_status = 0 AND astrologers.busy_status = 0 AND astrologers.call_status = 0 AND astrologers.chat_status = 0 AND astrologers.video_status = 0 THEN 17
      ELSE 18
    END`),
    'ASC'
  ]);

  // Final fallback: total waiting time
  orderArray.push([
    literal(`(
      SELECT IFNULL(SUM(waiting_time), 0)
      FROM call_history
      WHERE call_history.status IN ('queue', 'queue_request', 'request', 'in-progress')
        AND call_history.astrologer_uni_id = astrologers.astrologer_uni_id
    )`),
    'ASC'
  ]);
};

