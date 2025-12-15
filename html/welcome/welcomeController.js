import express from "express";
import moment from 'moment';
import Joi from "joi";
import City from "../_models/city.js";
import State from "../_models/state.js";
import Country from "../_models/country.js";

import { generateOrderId, generateNDigitRandomNumber } from '../_helpers/generator.js';
import { askQuestionCalculation, askQuestionList, courseList, coursePurchaseList, getAllBlog, getSettings, getVideoSections, saveApiLogs, ServiceCategory, getWalletHistory, userCallHistory, userGiftHistory, astroGiftHistory, trainingVideoList, getFollowers,
  astrologerServiceOrder} from "../_helpers/helper.js";
import { updateApiLogs } from "../_helpers/helper.js";
import { checkUserApiKey, getUserData } from "../_helpers/common.js";
import Language from "../_models/languages.js";
import Skill from "../_models/skills.js";
import Banner from "../_models/banners.js";
import BannerCategory from "../_models/banner_categories.js";
import BlogCategory from "../_models/blogCategory.js";
import UserAddress from "../_models/userAddress.js";
import { constants, CURRENCY, imagePath } from "../_config/constants.js";
import { Op, Sequelize } from "sequelize";
import Category from "../_models/categories.js";
import Astrologer from "../_models/astrologers.js";
import UserNotification from "../_models/userNotification.js";
import FollowersModel from "../_models/followers.js";
import multer from "multer";
import dayjs from "dayjs";
import embed from 'embed-video';
import ServiceCategorys from "../_models/serviceCategory.js";
import Suggestion from "../_models/suggestions.js";
import Pages from "../_models/pages.js";
import path from "path";
import { getConfig } from "../configStore.js";
import UserKundali from "../_models/userKundali.js";
import Customer from "../_models/customers.js";
import User from "../_models/users.js";
import Order from "../_models/order.js";
import orderProduct from "../_models/orderProduct.js";
import Product from "../_models/product.js";
import Wallet from '../_models/wallet.js';
import AskQuestion from "../_models/askQustion.js";
import  ServiceOrder  from '../_models/serviceOrder.js';
import { Service } from '../_models/service.js';
import { ServiceAssign } from '../_models/serviceAssign.js';
import Reviews from "../_models/reviews.js";
import { PredefinedMessage } from "../_models/predefinedMessage.js";
import { getFromCache, setToCache, CACHE_TTL } from "../_helpers/cacheHelper.js";


const upload = multer();

const router = express.Router();

const asset = (filePath) => {
  return `${process.env.ASSET_BASE_URL || ''}/${filePath}`;
};

router.post("/welcome", upload.none(), async (req, res) => {
  try {
    const settings = await getSettings();
    const master_data = {};

    settings.forEach(setting => {
      master_data[setting.setting_name] = setting.setting_value;
    });

    let payment_gateway = master_data['payment_gateway'] || '';
    if (payment_gateway === 'Razorpay') {
      payment_gateway = payment_gateway.toLowerCase();
    }

    // Default payment gateway for India
    let default_payment_gateway_for_india = master_data['default_payment_gateway_for_india'] || '';
    const gatewayMap = {
      phonepe: 'PhonePe',
      ccavenue: 'CCAvenue',
      cashfree: 'Cashfree',
      paypal: 'Paypal',
      payu: 'Payu',
    };
    default_payment_gateway_for_india = gatewayMap[default_payment_gateway_for_india] || default_payment_gateway_for_india;

    const payment = {
      default_payment_gateway: default_payment_gateway_for_india,
      razorpay: master_data['is_razorpay_active_for_app'] == 1 ? true: false,
      phonepe: master_data['is_phonepe_active_for_app'] == 1 ? true: false,
      ccavenue: master_data['is_ccavenue_active_for_app'] == 1 ? true: false,
      cashfree: master_data['is_cashfree_active_for_app'] == 1 ? true: false,
      paypal: master_data['is_paypal_active_for_app'] == 1 ? true: false,
      payu: master_data['is_payu_active_for_app'] == 1 ? true: false,
    };

    // Default payment gateway for other countries
    let default_payment_gateway_for_other_country = master_data['default_payment_gateway_for_other_country'] || '';
    default_payment_gateway_for_other_country = gatewayMap[default_payment_gateway_for_other_country] || default_payment_gateway_for_other_country;

    const payment_for_other_country = {
      default_payment_gateway: default_payment_gateway_for_other_country,
      razorpay: master_data['is_razorpay_active_for_other_country_app'] == 1 ? true: false,
      phonepe: master_data['is_phonepe_active_for_other_country_app'] == 1 ? true: false,
      ccavenue: master_data['is_ccavenue_active_for_other_country_app'] == 1 ? true: false,
      cashfree: master_data['is_cashfree_active_for_other_country_app'] == 1 ? true: false,
      paypal: master_data['is_paypal_active_for_other_country_app'] == 1 ? true: false,
      payu: master_data['is_payu_active_for_other_country_app'] == 1 ? true: false,
    };

    // Active Offer
    let active_offer = '';
    const first_call_offer = master_data['first_call_offer'];
    if (first_call_offer == 1) {
      active_offer = `Sign Up & Get ₹${master_data['customer_welcome_bonus']} Welcome Bonus!`;
    } else if (first_call_offer == 2) {
      active_offer = `First Consultation at ₹${master_data['first_call_price_per_min']} /min only`;
    } else if (first_call_offer == 3) {
      active_offer = `First Chat with Astrologer is FREE!`;
    }

    // Kundli API
    let active_kundli_api = '';
    const kundli_api_status = master_data['kundli_api_status'];
    if (kundli_api_status == 1) active_kundli_api = 'prokerala';
    else if (kundli_api_status == 2) active_kundli_api = 'vedicastro';
    else if (kundli_api_status == 3) active_kundli_api = 'jyotisham';

    const data = {
      company_name: master_data['company_name'],
      email: master_data['email'],
      postal_code: master_data['postal_code'],
      city: master_data['city'],
      state: master_data['state'],
      country: master_data['country'],
      address: master_data['address'],
      mobile_no: master_data['mobile_no'],
      firbase_api_token: master_data['firbase_api_token'],
      google_map_api_key: master_data['google_map_api_key'],
      zego_api_id: master_data['zego_api_id'],
      zego_secret_key: master_data['zego_secret_key'],
      razorpay_id: master_data['razorpay_id'],
      razorpay_key: master_data['razorpay_key'],
      agora_api_id: master_data['agora_api_id'],
      agora_api_certificate: master_data['agora_api_certificate'],
      send_bird_application_id: master_data['send_bird_application_id'],
      send_bird_api_token: master_data['send_bird_api_token'],
      client_id_prokerala: master_data['client_id_prokerala'],
      client_secret_prokerala: master_data['client_secret_prokerala'],
      vedic_astro_api_key: master_data['vedic_astro_api_key'],
      logo: `${req.protocol}://${req.get("host")}/${constants.setting_image_path}${master_data['logo']}`,
      back_website_logo: `${req.protocol}://${req.get("host")}/${constants.setting_image_path}${master_data['logo']}`,
      website_favicon: `${req.protocol}://${req.get("host")}/${constants.setting_image_path}${master_data['logo']}`,
      youtube_link: master_data['youtube_link'] || '',
      linkedin_link: master_data['linkedin_link'] || '',
      instagram_link: master_data['instagram_link'] || '',
      google_link: master_data['google_link'] || '',
      twitter_link: master_data['twitter_link'] || '',
      facebook_link: master_data['facebook_link'] || '',
      whatsapp_number: master_data['whatsapp_number'] || '',
      telephone: master_data['telephone'] || '',
      service_refund_duration: master_data['service_refund_duration'] || '',
      share_chat_link: master_data['share_chat_link'] || '',
      payment_gateway,
      payment,
      payment_for_other_country,
      architect_category_id: `${constants.ARCHITECT_CATEGORY_ID || 0}`,
      electro_homoeopathy_category_id: `${constants.ELECTRO_HOMOEOPATHY_CATEGORY_ID || 0}`,
      otpless_cust_app_id: master_data['otpless_cust_app_id'] || '',
      otpless_cust_client_id: master_data['otpless_cust_client_id'] || '',
      otpless_astro_app_id: master_data['otpless_astro_app_id'] || '',
      otpless_astro_client_id: master_data['otpless_astro_client_id'] || '',
      gmail_client_id: master_data['gmail_client_id'] || '',
      gmail_client_secret: master_data['gmail_client_secret'] || '',
      kundli_matching_price: master_data['kundli_matching_price'] || '',
      horoscope_price: master_data['horoscope_price'] || '',
      open_ai_prediction_price: master_data['open_ai_prediction_price'] || '',
      in_app_voice_call: parseInt(master_data['in_app_voice_call'] || 0),
      jyotisham_api_key: master_data['jyotisham_api_key'] || '',
      phonepe_merchant_id: master_data['phonepe_merchant_id'] || '',
      phonepe_salt_key: master_data['phonepe_salt_key'] || '',
      phonepe_salt_index: master_data['phonepe_salt_index'] || '',
      feedback_email: master_data['feedback_email'] || '',
      default_currency_code: CURRENCY.default_currency_code || 'INR',
      default_currency_symbol: CURRENCY.default_currency_symbol || '₹',
      default_exchange_rate: CURRENCY.default_exchange_rate || 1,
      active_offer,
      active_kundli_api,
      ask_question_price: master_data['ask_question_price'] || '',
      splash_screen_about_us: master_data['splash_screen_about_us'] || '',
      splash_screen_why_choose_us: (() => {
        // First check if splash_screen_why_choose_us exists directly
        if (master_data['splash_screen_why_choose_us'] && master_data['splash_screen_why_choose_us'].trim() !== '') {
          return master_data['splash_screen_why_choose_us'];
        }
        
        // Otherwise, combine existing why_choose settings from database
        const whyChooseItems = [];
        
        // Years of Experience
        if (master_data['why_choose_years_of_experience']) {
          whyChooseItems.push({
            icon: 'fas fa-user-tie',
            title: `${master_data['why_choose_years_of_experience']}+ Years of Experience`,
            description: 'Our astrologers and Vastu consultants bring over 50 years of expertise to provide accurate and insightful guidance.'
          });
        }
        
        // Satisfied Customers
        if (master_data['why_choose_satisfied_customer']) {
          whyChooseItems.push({
            icon: 'fas fa-users',
            title: `${master_data['why_choose_satisfied_customer']}+ Satisfied Customers`,
            description: 'More than 1500 customers have received our services, and many more are joining every day.'
          });
        }
        
        // Best Astrologers
        if (master_data['why_choose_best_astrologers']) {
          whyChooseItems.push({
            icon: 'fas fa-star',
            title: `${master_data['why_choose_best_astrologers']}+ Best Astrologers`,
            description: 'We have hand-picked over 1100 expert astrologers from India, ready to offer online consultations.'
          });
        }
        
        // Nationalities
        if (master_data['why_choose_Nationalities']) {
          whyChooseItems.push({
            icon: 'fas fa-globe-americas',
            title: `${master_data['why_choose_Nationalities']}+ Nationalities`,
            description: 'Our services are trusted by clients from over 140 nationalities across the globe.'
          });
        }
        
        // Return as JSON string if items found, otherwise empty string
        return whyChooseItems.length > 0 ? JSON.stringify(whyChooseItems) : '';
      })(),
      default_country_code: '+' + (master_data['default_country_code'] || '91').replace('+', ''),
      default_country_name: master_data['default_country_name'] || 'India',
      astro_update_request_list: constants.astro_update_request_list || '',
    };

    res.json({
      status: 1,
      data,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: 'Server error',
    });
  }
});

router.post("/cityList", upload.none(), async (req, res) => {
  const api = await saveApiLogs(req); // saving request log

  // First validation: api_key and user_uni_id
  const baseSchema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    state_id: Joi.required(),
  });

  const baseValidation = baseSchema.validate(req.body);
  if (baseValidation.error) {
    const result = {
      status: 0,
      errors: baseValidation.error.details,
      message: "Something went wrong",
      msg: baseValidation.error.details.map((d) => d.message).join("\n"),
    };
    return res.json(result);
  }

  const { api_key, user_uni_id, state_id } = req.body;

  // Check API Key
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    await updateApiLogs(api, result);
    return res.json(result);
  }

  // Second validation: state_id
  // const stateSchema = Joi.object({
  //   state_id: Joi.required(),
  // });

  // const stateValidation = stateSchema.validate(req.body);
  // if (stateValidation.error) {
  //   const result = {
  //     status: 0,
  //     errors: stateValidation.error.details,
  //     message: 'Something went wrong',
  //     msg: stateValidation.error.details.map(d => d.message).join('\n'),
  //   };
  //   await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  // Fetch cities
  try {
    const records = await City.findAll({ where: { state_id } });
    
    // Convert Sequelize models to plain JSON objects
    const citiesData = records.map(city => city.toJSON ? city.toJSON() : city);
    
    const result =
      citiesData.length > 0
        ? { status: 1, data: citiesData, msg: "Success" }
        : { status: 0, msg: "Something Went wrong.. Try Again" };

    await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("City fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error" };
    await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
});

router.post("/stateList", upload.none(), async (req, res) => {
  const api = await saveApiLogs(req); // saving request log

  // First validation: api_key and user_uni_id
  const baseSchema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    country_id: Joi.required(),
  });

  const baseValidation = baseSchema.validate(req.body);
  if (baseValidation.error) {
    const result = {
      status: 0,
      errors: baseValidation.error.details,
      message: "Something went wrong",
      msg: baseValidation.error.details.map((d) => d.message).join("\n"),
    };
    return res.json(result);
  }

  const { api_key, user_uni_id, country_id } = req.body;

  // Check API Key
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    await updateApiLogs(api, result);
    return res.json(result);
  }

  // Second validation: state_id
  // const stateSchema = Joi.object({
  //   state_id: Joi.required(),
  // });

  // const stateValidation = stateSchema.validate(req.body);
  // if (stateValidation.error) {
  //   const result = {
  //     status: 0,
  //     errors: stateValidation.error.details,
  //     message: 'Something went wrong',
  //     msg: stateValidation.error.details.map(d => d.message).join('\n'),
  //   };
  //   await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  // Fetch states
  try {
    const records = await State.findAll({ where: { country_id } });
    
    // Convert Sequelize models to plain JSON objects
    const statesData = records.map(state => state.toJSON ? state.toJSON() : state);
    
    const result =
      statesData.length > 0
        ? { status: 1, data: statesData, msg: "Success" }
        : { status: 0, msg: "Something Went wrong.. Try Again" };

    await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("State fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error" };
    await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
});

// Public country list endpoint (no auth required - for login/registration)
router.post("/publicCountryList", upload.none(), async (req, res) => {
  try {
    const records = await Country.findAll({
      attributes: ['id', 'name', 'nicename', 'phonecode', 'iso', 'iso3'],
      order: [['name', 'ASC']]
    });
    
    console.log(`[publicCountryList] Found ${records.length} countries`);
    
    const result =
      records.length > 0
        ? { status: 1, data: records, msg: "Success", count: records.length }
        : { status: 0, msg: "No countries found", data: [] };

    return res.json(result);
  } catch (error) {
    console.error("Country fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error", error: error.message, data: [] };
    return res.status(500).json(result);
  }
});

// Public state list endpoint (no auth required - for registration)
router.post("/publicStateList", upload.none(), async (req, res) => {
  try {
    const { country_id } = req.body;
    
    if (!country_id) {
      return res.json({ status: 0, msg: "country_id is required", data: [] });
    }

    const records = await State.findAll({ 
      where: { country_id },
      attributes: ['id', 'state_name', 'country_id', 'status']
    });
    
    // Convert Sequelize models to plain JSON objects
    const statesData = records.map(state => state.toJSON ? state.toJSON() : state);
    
    console.log(`[publicStateList] Found ${statesData.length} states for country_id: ${country_id}`);
    
    const result =
      statesData.length > 0
        ? { status: 1, data: statesData, msg: "Success" }
        : { status: 0, msg: "No states found", data: [] };

    return res.json(result);
  } catch (error) {
    console.error("State fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error", error: error.message, data: [] };
    return res.status(500).json(result);
  }
});

// Public city list endpoint (no auth required - for registration)
router.post("/publicCityList", upload.none(), async (req, res) => {
  try {
    const { state_id } = req.body;
    
    if (!state_id) {
      return res.json({ status: 0, msg: "state_id is required", data: [] });
    }

    const records = await City.findAll({ 
      where: { state_id },
      attributes: ['id', 'city_name', 'state_id', 'city_pincode', 'status']
    });
    
    // Convert Sequelize models to plain JSON objects
    const citiesData = records.map(city => city.toJSON ? city.toJSON() : city);
    
    console.log(`[publicCityList] Found ${citiesData.length} cities for state_id: ${state_id}`);
    
    const result =
      citiesData.length > 0
        ? { status: 1, data: citiesData, msg: "Success" }
        : { status: 0, msg: "No cities found", data: [] };

    return res.json(result);
  } catch (error) {
    console.error("City fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error", error: error.message, data: [] };
    return res.status(500).json(result);
  }
});

router.post("/countryList", upload.none(), async (req, res) => {
  const api = await saveApiLogs(req); // saving request log

  // First validation: api_key and user_uni_id
  const baseSchema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
  });

  const baseValidation = baseSchema.validate(req.body);
  if (baseValidation.error) {
    const result = {
      status: 0,
      errors: baseValidation.error.details,
      message: "Something went wrong",
      msg: baseValidation.error.details.map((d) => d.message).join("\n"),
    };
    return res.json(result);
  }

  const { api_key, user_uni_id } = req.body;

  // Check API Key
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    await updateApiLogs(api, result);
    return res.json(result);
  }

  // Second validation: state_id
  // const stateSchema = Joi.object({
  //   state_id: Joi.required(),
  // });

  // const stateValidation = stateSchema.validate(req.body);
  // if (stateValidation.error) {
  //   const result = {
  //     status: 0,
  //     errors: stateValidation.error.details,
  //     message: 'Something went wrong',
  //     msg: stateValidation.error.details.map(d => d.message).join('\n'),
  //   };
  //   await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  // Fetch cities
  try {
    const records = await Country.findAll();
    const result =
      records.length > 0
        ? { status: 1, data: records, msg: "Success" }
        : { status: 0, msg: "Something Went wrong.. Try Again" };

    await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("City fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error" };
    await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
});

router.post("/languageList", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req); // saving request log

  // // First validation: api_key and user_uni_id
  // const baseSchema = Joi.object({
  //   api_key: Joi.string().required(),
  //   user_uni_id: Joi.string().required()
  // });

  // const baseValidation = baseSchema.validate(req.body);
  // if (baseValidation.error) {
  //   const result = {
  //     status: 0,
  //     errors: baseValidation.error.details,
  //     message: 'Something went wrong',
  //     msg: baseValidation.error.details.map(d => d.message).join('\n'),
  //   };
  //   return res.json(result);
  // }

  // const { api_key, user_uni_id } = req.body;

  // // Check API Key
  // const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  // if (!isAuthorized) {
  //   const result = {
  //     status: 0,
  //     error_code: 101,
  //     msg: 'Unauthorized User... Please login again',
  //   };
  //   await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  // Second validation: state_id
  // const stateSchema = Joi.object({
  //   state_id: Joi.required(),
  // });

  // const stateValidation = stateSchema.validate(req.body);
  // if (stateValidation.error) {
  //   const result = {
  //     status: 0,
  //     errors: stateValidation.error.details,
  //     message: 'Something went wrong',
  //     msg: stateValidation.error.details.map(d => d.message).join('\n'),
  //   };
  //   await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  // Fetch cities
  try {
    const records = await Language.findAll({ where: { status: 1 } });
    const result =
      records.length > 0
        ? { status: 1, data: records, msg: "Success" }
        : { status: 0, msg: "Something Went wrong.. Try Again" };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("City fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error" };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
});

router.post("/skillList", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req); // saving request log

  // // First validation: api_key and user_uni_id
  // const baseSchema = Joi.object({
  //   api_key: Joi.string().required(),
  //   user_uni_id: Joi.string().required()
  // });

  // const baseValidation = baseSchema.validate(req.body);
  // if (baseValidation.error) {
  //   const result = {
  //     status: 0,
  //     errors: baseValidation.error.details,
  //     message: 'Something went wrong',
  //     msg: baseValidation.error.details.map(d => d.message).join('\n'),
  //   };
  //   return res.json(result);
  // }

  // const { api_key, user_uni_id } = req.body;

  // // Check API Key
  // const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  // if (!isAuthorized) {
  //   const result = {
  //     status: 0,
  //     error_code: 101,
  //     msg: 'Unauthorized User... Please login again',
  //   };
  //   await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  // Second validation: state_id
  // const stateSchema = Joi.object({
  //   state_id: Joi.required(),
  // });

  // const stateValidation = stateSchema.validate(req.body);
  // if (stateValidation.error) {
  //   const result = {
  //     status: 0,
  //     errors: stateValidation.error.details,
  //     message: 'Something went wrong',
  //     msg: stateValidation.error.details.map(d => d.message).join('\n'),
  //   };
  //   await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  // Fetch cities
  try {
    const records = await Skill.findAll({ where: { status: 1 } });
    const result =
      records.length > 0
        ? { status: 1, data: records, msg: "Success" }
        : { status: 0, msg: "Something Went wrong.. Try Again" };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("City fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error" };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
});

router.post("/bannerList", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req); // saving request log

  // // First validation: api_key and user_uni_id
  // const baseSchema = Joi.object({
  //   api_key: Joi.string().required(),
  //   user_uni_id: Joi.string().required()
  // });

  // const baseValidation = baseSchema.validate(req.body);
  // if (baseValidation.error) {
  //   const result = {
  //     status: 0,
  //     errors: baseValidation.error.details,
  //     message: 'Something went wrong',
  //     msg: baseValidation.error.details.map(d => d.message).join('\n'),
  //   };
  //   return res.json(result);
  // }

  // const { api_key, user_uni_id } = req.body;

  // // Check API Key
  // const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  // if (!isAuthorized) {
  //   const result = {
  //     status: 0,
  //     error_code: 101,
  //     msg: 'Unauthorized User... Please login again',
  //   };
  //   await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  // Second validation: state_id
  // const stateSchema = Joi.object({
  //   state_id: Joi.required(),
  // });

  // const stateValidation = stateSchema.validate(req.body);
  // if (stateValidation.error) {
  //   const result = {
  //     status: 0,
  //     errors: stateValidation.error.details,
  //     message: 'Something went wrong',
  //     msg: stateValidation.error.details.map(d => d.message).join('\n'),
  //   };
  //   await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  // Check cache first
  try {
    const cacheKey = { endpoint: 'bannerList', category: 1 };
    const cachedResult = await getFromCache('banners', cacheKey);
    
    if (cachedResult) {
      // Update image URLs with current host
      const records = cachedResult.data || [];
      for (const banner of records) {
        banner.banner_image = banner.banner_image
          ? banner.banner_image.replace(/https?:\/\/[^/]+/, `${req.protocol}://${req.get("host")}`)
          : `${req.protocol}://${req.get("host")}/${constants.default_banner_image_path}`;
      }
      return res.json(cachedResult);
    }

    // Fetch from database
    const records = await Banner.findAll({ where: { status: 1, banner_category_id: 1 }, attributes: ["id", "banner_category_id", "banner_image", "url"] , limit: constants.api_page_limit});
    for (const banner of records) {
      banner.url = banner.url || '';
      banner.banner_image =  banner.banner_image
        ? `${req.protocol}://${req.get("host")}/${constants.banner_image_path}${banner.banner_image}`
        : `${req.protocol}://${req.get("host")}/${constants.default_banner_image_path}`;
    }
    const result =
      records.length > 0
        ? { status: 1, data: records, msg: "Success" }
        : { status: 0, msg: "Something Went wrong.. Try Again" };

    // Cache the result (5 minutes TTL)
    await setToCache('banners', cacheKey, result, CACHE_TTL.MEDIUM);

    return res.json(result);
  } catch (error) {
    console.error("Banner fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error" };
    return res.status(500).json(result);
  }
});

// Get all banner categories
router.post("/getBannerCategories", upload.none(), async (req, res) => {
  try {
    const records = await BannerCategory.findAll({
      where: { status: '1' },
      attributes: ["id", "title"],
      order: [["id", "ASC"]]
    });

    const result = records.length > 0
      ? { status: 1, data: records, msg: "Success" }
      : { status: 0, data: [], msg: "No categories found" };

    return res.json(result);
  } catch (error) {
    console.error("Banner categories fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error" };
    return res.status(500).json(result);
  }
});

router.post("/userAddressList", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req);

  // Step 1: Validate api_key and user_uni_id
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((d) => d.message).join("\n"),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id } = value;

  // Step 2: Check API Key
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

  // Step 3: Fetch user address records
  try {
    const records = await UserAddress.findAll({
      where: { user_uni_id },
      order: [["created_at", "DESC"]],
    });

    const result =
      records.length > 0
        ? {
            status: 1,
            data: records,
            msg: "Record Found",
          }
        : {
            status: 0,
            msg: "No Record Found",
          };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("userAddressList error:", error);
    const result = {
      status: 0,
      msg: "Internal Server Error",
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

router.post("/categoryList", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req);

  // Validate input
  const schema = Joi.object({
    search: Joi.string().optional().allow(null,""),
    is_live: Joi.number().optional().allow(null,""),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  // const { search, is_live } = value;

  try {
    // Base query
    let queryOptions = {
      where: {
        status: 1,
        id: {
          [Op.notIn]: [constants.ARCHITECT_CATEGORY_ID, constants.ELECTRO_HOMOEOPATHY_CATEGORY_ID],
        },
      },
      include: [],
    };

    if (req.body) {

      const { search, is_live } = value;
      // Filter by live astrologers
    if (is_live === 1) {
      queryOptions.include.push({
        model: Astrologer,
        as: "astrologers",
        where: { live_status: 1 },
        required: true,
      });
    }

    // Search filter
    if (search && search.trim() !== "") {
      queryOptions.where.category_title = {
        [Op.like]: `%${search.trim()}%`,
      };
    }
    }

    

    // Execute query
    const categories = await Category.findAll(queryOptions);

    // Append full image path
    const data = categories.map((cat) => {
      const catJson = cat.toJSON();
      catJson.category_images = `${req.protocol}://${req.get("host")}/${imagePath.CATEGORY_IMAGE_PATH}${cat.category_images}`;
      return catJson;
    });

    const result =
      data.length > 0
        ? { status: 1, data, msg: "all category List" }
        : { status: 0, msg: "no data" };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error("Error fetching categories:", err);
    const result = { status: 0, msg: "Internal Server Error" };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
});

// router.post("/notificationList", upload.none(), async (req, res) => {
//   // const api = await saveApiLogs(req.body); 

//   // Step 1: Validate base input
//   const schema = Joi.object({
//     api_key: Joi.string().required(),
//     user_uni_id: Joi.string().required(),
//     offset: Joi.number().optional(),
//   });

//   const validation = schema.validate(req.body);
//   if (validation.error) {
//     const result = {
//       status: 0,
//       errors: validation.error.details,
//       message: "Something went wrong",
//       msg: validation.error.details.map((d) => d.message).join("\n"),
//     };
//     // await updateApiLogs(api, result);
//     return res.json(result);
//   }

//   const { api_key, user_uni_id, offset = 0 } = req.body;

//   // Step 2: Check API key validity
//   const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
//   if (!isAuthorized) {
//     const result = {
//       status: 0,
//       error_code: 101,
//       msg: "Unauthorized User... Please login again",
//     };
//     // await updateApiLogs(api, result);
//     return res.json(result);
//   }

//   // Step 3: Fetch notifications
//   const limit = constants.api_page_limit_notification
//     ? parseInt(constants.api_page_limit_notification)
//     : 8;

//   try {
//     const notifications = await UserNotification.findAll({
//       where: { user_uni_id },
//       offset,
//       limit,
//       order: [["id", "DESC"]],
//     });

//     const result =
//       notifications && notifications.length > 0
//         ? {
//             status: 1,
//             offset: offset + limit,
//             data: notifications,
//             msg: "Get Notifications",
//           }
//         : {
//             status: 0,
//             msg: "No Record found",
//           };

//     // await updateApiLogs(api, result);
//     return res.json(result);
//   } catch (err) {
//     console.error("Notification fetch error:", err);
//     const result = { status: 0, msg: "Internal Server Error" };
//     // await updateApiLogs(api, result);
//     return res.status(500).json(result);
//   }
// });

router.post("/notificationList", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body); 

  // Step 1: Validate base input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().optional(),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    const result = {
      status: 0,
      errors: validation.error.details,
      message: "Something went wrong",
      msg: validation.error.details.map((d) => d.message).join("\n"),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, offset } = req.body;

  // Step 2: Check API key validity
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

  // Step 3: Fetch notifications
  const limit = constants.api_page_limit_notification
    ? parseInt(constants.api_page_limit_notification)
    : 8;
  const offsets = offset ? parseInt(offset) : 0

  try {
    const notifications = await UserNotification.findAll({
      where: { user_uni_id },
      offset: offsets,
      limit: limit,
      order: [["id", "DESC"]],
    });

   

    for (const notification of notifications) {
      notification.dataValues.created_at = notification.dataValues.created_at ? dayjs(notification.dataValues.created_at).format('YYYY-MM-DD HH:mm:ss'): "N/A"
      notification.dataValues.updated_at = notification.dataValues.updated_at ? dayjs(notification.dataValues.updated_at).format('YYYY-MM-DD HH:mm:ss'): "N/A"
      notification.image = notification.image ? `${req.protocol}://${req.get("host")}/uploads/notification/${notification.image}` : ""
    }
 
    const result =
      notifications && notifications.length > 0
        ? {
            status: 1,
            offset: offsets + limit,
            data: notifications,
            msg: "Get Notifications",
          }
        : {
            status: 0,
            msg: "No Record found",
          };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error("Notification fetch error:", err);
    const result = { status: 0, msg: "Internal Server Error" };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
});

router.post("/deleteNotification", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  // Joi validation schema
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    is_all_delete: Joi.number().valid(0, 1).required(),
    notification_id: Joi.when('is_all_delete', {
      is: 0,
      then: Joi.number().required(),
      otherwise: Joi.any().optional(),
    }),
  });

  // Validate request
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n'),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, notification_id = 0, is_all_delete } = value;

  // Check API key validity
  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  try {
    let notification = null;

    if (is_all_delete === 1) {
      notification = await UserNotification.findAll({ where: { user_uni_id } });
    } else if (notification_id > 0) {
      notification = await UserNotification.findOne({ where: { user_uni_id, id: notification_id } });
    }

    if (notification && (Array.isArray(notification) ? notification.length > 0 : true)) {
      if (is_all_delete === 1) {
        await UserNotification.destroy({ where: { user_uni_id } });
      } else {
        await notification.destroy();
      }

      const result = {
        status: 1,
        msg: 'Notification Deleted Successfully',
      };
      // await updateApiLogs(api, result);
      return res.json(result);
    } else {
      const result = {
        status: 0,
        msg: 'No Record found',
      };
      // await updateApiLogs(api, result);
      return res.json(result);
    }
  } catch (err) {
    const result = {
      status: 0,
      msg: 'Server Error',
      error: err.message,
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

router.post('/astrologerFollow', upload.none(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);

  // Step 1: Validate input using Joi
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    status: Joi.number().valid(0, 1).required(),
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

  const { api_key, user_uni_id, astrologer_uni_id, status } = value;

  // Step 2: API key validation
  const isValidApiKey = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidApiKey) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(apiLog, result);
    return res.status(401).json(result);
  }

  const msg = status === 1 ? 'Follow' : 'Unfollow';

  try {
    // Step 3: Check if same follow/unfollow already exists
    const existing = await FollowersModel.findOne({
      where: {
        astrologer_uni_id,
        user_uni_id,
        status
      }
    });

    let result;

    if (!existing) {
      // Check if an entry exists with different status
      const existingEntry = await FollowersModel.findOne({
        where: {
          astrologer_uni_id,
          user_uni_id
        }
      });

      if (!existingEntry) {
        await FollowersModel.create({ astrologer_uni_id, user_uni_id, status });
      } else {
        await existingEntry.update({ status });
      }

      result = {
        status: 1,
        msg: `Successfully ${msg}`
      };
    } else {
      result = {
        status: 0,
        msg: `Already ${msg}`
      };
    }

    // await updateApiLogs(apiLog, result);
    return res.json(result);

  } catch (err) {
    console.log(err);
    
    const result = {
      status: 0,
      msg: 'Something went wrong',
      error: err.message
    };
    // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
});

// Get all blog categories
router.post("/getBlogCategories", upload.none(), async (req, res) => {
  try {
    const records = await BlogCategory.findAll({
      where: { status: 1 },
      attributes: ["id", "title", "slug", "image"],
      order: [["id", "ASC"]]
    });

    const result = records.length > 0
      ? { status: 1, data: records, msg: "Success" }
      : { status: 0, data: [], msg: "No categories found" };

    return res.json(result);
  } catch (error) {
    console.error("Blog categories fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error" };
    return res.status(500).json(result);
  }
});

router.post("/getBlog", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req);

  const schema = Joi.object({
    api_key: Joi.string().optional().allow(null, ""),
    user_uni_id: Joi.string().optional().allow(null, ""),
    astrologer_uni_id: Joi.string().optional().allow(null, ""),
    offset: Joi.number().optional().allow(null, ""),
    search: Joi.string().optional().allow(null, "")
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    const result = {
      status: 0,
      errors: validation.error.details,
      message: "Something went wrong",
      msg: validation.error.details.map((d) => d.message).join("\n")
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const offset = 0;
  let attributes;

  const limit = constants.api_page_limit;

  attributes = {
    ...req.body,
    status: 1,
    offset: Number(offset),
    limit
  };

  if(req.body) {
   const { offset } = req.body;
   attributes = {
    ...req.body,
    status: 1,
    offset: Number(offset),
    limit
  };
  }

  try {
    // Check cache first (only for non-search queries)
    const cacheKey = {
      offset: Number(attributes.offset),
      limit: Number(attributes.limit),
      astrologer_uni_id: attributes.astrologer_uni_id || '',
      search: attributes.search || ''
    };
    
    // Only cache if no search
    if (!attributes.search) {
      const cachedResult = await getFromCache('blogs', cacheKey);
      if (cachedResult) {
        // Update image URLs with current host
        const blogs = cachedResult.data || [];
        for (const blog of blogs) {
          blog.blog_image = blog.blog_image
            ? blog.blog_image.replace(/https?:\/\/[^/]+/, `${req.protocol}://${req.get("host")}`)
            : `${req.protocol}://${req.get("host")}/${constants.default_image_path}`;
        }
        return res.json(cachedResult);
      }
    }

    console.log('[getBlog] Fetching blogs with attributes:', JSON.stringify(attributes, null, 2));
    const blogs = await getAllBlog(attributes);
    console.log('[getBlog] Total blogs fetched from database:', blogs?.length || 0);

    for (const blog of blogs) {
      blog.dataValues.is_astro_follow = !!blog.dataValues.is_astro_follow;
      blog.dataValues.is_likes = !!blog.dataValues.is_likes;
      blog.dataValues.created_at = dayjs(blog.dataValues.created_at).format('YYYY-MM-DD HH:mm:ss');
      blog.dataValues.updated_at = dayjs(blog.dataValues.updated_at).format('YYYY-MM-DD HH:mm:ss');

      blog.blog_image =  blog.blog_image
        ? `${req.protocol}://${req.get("host")}/${constants.blog_image_path}${blog.blog_image}`
        : `${req.protocol}://${req.get("host")}/${constants.default_image_path}`;
      
    }

    const result =
      blogs && blogs.length > 0
        ? {
            status: 1,
            msg: "Result Found",
            offset: attributes.offset + limit,
            data: blogs
          }
        : {
            status: 0,
            msg: "No Record Found"
          };

    // Cache the result (only if no search)
    if (!attributes.search) {
      await setToCache('blogs', cacheKey, result, CACHE_TTL.MEDIUM);
    }

    return res.json(result);
  } catch (error) {
    console.error("Blog Fetch Error:", error);
    const result = {
      status: 0,
      msg: "Internal Server Error"
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
});

// Get single blog by ID or slug
router.post("/getBlogDetail", upload.none(), async (req, res) => {
  const schema = Joi.object({
    id: Joi.number().optional().allow(null, ""),
    slug: Joi.string().optional().allow(null, "")
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    const result = {
      status: 0,
      errors: validation.error.details,
      message: "Something went wrong",
      msg: validation.error.details.map((d) => d.message).join("\n")
    };
    return res.json(result);
  }

  const { id, slug } = req.body;

  if (!id && !slug) {
    return res.json({
      status: 0,
      msg: "Please provide id or slug"
    });
  }

  try {
    const whereClause = { status: '1' };
    
    if (id) {
      whereClause.id = Number(id);
    } else if (slug) {
      whereClause.slug = slug;
    }

    console.log('[getBlogDetail] Fetching blog with:', whereClause);

    const filter = {
      status: 1,
      ...(id ? { id: Number(id) } : {}),
      ...(slug ? { slug: slug } : {})
    };

    // Use getAllBlog but with specific filter
    const blogs = await getAllBlog({ 
      ...filter,
      limit: 1,
      offset: 0
    });

    if (!blogs || blogs.length === 0) {
      return res.json({
        status: 0,
        msg: "Blog not found"
      });
    }

    const blog = blogs[0];

    // Process blog data
    blog.dataValues.is_astro_follow = !!blog.dataValues.is_astro_follow;
    blog.dataValues.is_likes = !!blog.dataValues.is_likes;
    blog.dataValues.created_at = dayjs(blog.dataValues.created_at).format('YYYY-MM-DD HH:mm:ss');
    blog.dataValues.updated_at = dayjs(blog.dataValues.updated_at).format('YYYY-MM-DD HH:mm:ss');

    blog.blog_image = blog.blog_image
      ? `${req.protocol}://${req.get("host")}/${constants.blog_image_path}${blog.blog_image}`
      : `${req.protocol}://${req.get("host")}/${constants.default_image_path}`;

    return res.json({
      status: 1,
      data: blog,
      msg: "Blog found"
    });
  } catch (error) {
    console.error("Blog Detail Fetch Error:", error);
    return res.status(500).json({
      status: 0,
      msg: "Internal Server Error",
      error: error.message
    });
  }
});

router.post("/courseList", upload.none(), async (req, res) => {
  // saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().allow('', null),
    user_uni_id: Joi.string().allow('', null),
    search: Joi.string().allow('', null),
    offset: Joi.number().integer().min(0).allow(null),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n'),
    });
  }

  const { api_key = '', user_uni_id = '', search = '', offset = 0 } = value;

  // 3. Check API key & user ID if present
  if (api_key || user_uni_id) {
    const authorized = await checkUserApiKey(api_key, user_uni_id);
    if (!authorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }
  }

  // 4. Set pagination defaults
  const page_limit = constants.api_page_limit;
  const requestData = {
    ...value,
    offset,
    limit: page_limit,
  };

  // 5. Fetch data from service
  const data = await courseList(requestData);

  // 6. Return formatted response
  if (data.length > 0) {
    return res.json({
      status: 1,
      offset: offset + page_limit,
      data,
      msg: 'Get successfully',
    });
  } else {
    return res.json({
      status: 0,
      data: '',
      msg: 'No data found',
    });
  }
});

router.post("/coursePurchaseList", upload.none(), async (req, res) => {
  // saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().allow('', null),
    user_uni_id: Joi.string().allow('', null),
    offset: Joi.number().integer().min(0).allow(null),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n'),
    });
  }

  const { api_key = '', user_uni_id = '', offset = 0 } = value;

  // 3. Check API key & user ID if present
  if (api_key || user_uni_id) {
    const authorized = await checkUserApiKey(api_key, user_uni_id);
    if (!authorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }
  }

  // 4. Set pagination defaults
  const page_limit = constants.api_page_limit_secondary;
  const requestData = {
    ...value,
    offset,
    limit: page_limit,
  };

  // 5. Fetch data from service
  const data = await coursePurchaseList(requestData);

  // 6. Return formatted response
  if (data.length > 0) {
    return res.json({
      status: 1,
      offset: offset + page_limit,
      data,
      msg: 'Get successfully',
    });
  } else {
    return res.json({
      status: 0,
      data: '',
      msg: 'No data found',
    });
  }
});

router.post("/askQuestionCalculation", upload.none(), async (req, res) => {
  // await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    customer_uni_id: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    offer_code: Joi.string().optional().allow(null, ''),
    wallet_check: Joi.any().optional(), // This will be force-set to 1 below
  });


  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((d) => d.message).join('\n'),
    });
  }

  const { api_key, customer_uni_id } = value;

  const isValidUser = await checkUserApiKey(api_key, customer_uni_id);
  if (!isValidUser) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  value.wallet_check = 1;

  const result = await askQuestionCalculation(value);
  return res.json(result);
})


/////////////////////////////////vishal/////////////////////////
//router.post("/askQuestionPurchase", upload.none(), async (req, res) => {})
router.post('/askQuestionPurchase', upload.none(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);

  try {
    const {
      api_key,
      customer_uni_id,
      astrologer_uni_id,
      question,
      offer_code = null,
      wallet_check = 1,
      payment_method = '',
      is_updated = 0
    } = req.body;

    // Basic Validation
    if (!api_key || !customer_uni_id || !astrologer_uni_id || !question) {
      return res.status(400).json({
        status: 0,
        msg: "Validation error: Missing required fields"
      });
    }

    // Validate API key
    const isValidUser = await checkUserApiKey(api_key, customer_uni_id);
    if (!isValidUser) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

    // Fetch customer & user details
    const customerRecord = await Customer.findOne({
  where: { customer_uni_id },
  include: [{ model: User, as: 'user' }],
  raw: true,
  nest: true
});

const { user, ...customerBase } = customerRecord || {};
const customerData = {
  ...customerBase,
  ...user,
};


    // ✅ FIXED: Pass only required values to calculation logic
    const input = {
      api_key,
      customer_uni_id,
      astrologer_uni_id,
      offer_code,
      question,
      wallet_check: 1
    };

    const result = await askQuestionCalculation(input);

    if (!result || result.status === 0) {
      return res.json({
        status: 0,
        order_id: '',
        msg: result?.msg || 'Ask Question price is invalid',
        customerData
      });
    }

    // Generate Order ID
    const order_id = generateOrderId('ASKQ');
    const payable = result.data?.payable_amount || 0;

    // If payment required (non-zero)
    if (payable > 0) {
      if (payment_method === 'Payu') {
        const gateway_order_id = 'ORD' + generateRandomDigits(8);
        const phone = customerData?.user?.phone || '';
        const payu_data = {
          gateway_order_id,
          amount: payable,
          successURL: "https://yourdomain.com/paymentresponsepayuapp",
          failureURL: "https://yourdomain.com/paymentresponsepayuapp",
          customer_id: customer_uni_id,
          customer_phone: phone.slice(-10),
          customer_name: customerData?.user?.name || '',
          customer_email: customerData?.user?.email || '',
          description: 'Ask Question Purchase',
          is_updated,
        };

        return res.json({
          status: 1,
          order_id,
          payment_gateway_status: 1,
          payment_gateway: payu_data,
          msg: 'Payment Gateway Request',
          data: result.data,
          customerData
        });
      } else {
        return res.json({
          status: 0,
          order_id: '',
          msg: 'No Payment Gateway Available',
          customerData
        });
      }
    }

    // ✅ Wallet deduction flow (if payable is 0)
    await AskQuestion.create({
      order_id,
      customer_uni_id,
      astrologer_uni_id,
      question,
      total_amount: result.data.finalamount,
      status: 1,
      answer_status: 0,
      payment_status: 1,
    });

    await Wallet.bulkCreate([
      {
        reference_id: order_id,
        gateway_order_id: '',
        gateway_payment_id: '',
        user_uni_id: customer_uni_id,
        transaction_code: 'remove_wallet_by_ask_question',
        wallet_history_description: `Remove Amount by Ask Question # RS. ${result.data.finalamount}`,
        transaction_amount: result.data.finalamount,
        amount: result.data.finalamount,
        main_type: 'dr',
        offer_code,
        status: 1
      },
      {
        user_uni_id: astrologer_uni_id,
        reference_id: order_id,
        gateway_payment_id: '',
        transaction_code: 'add_wallet_by_ask_question',
        wallet_history_description: `Add Amount by Ask Question # RS. ${result.data.finalamount}`,
        transaction_amount: result.data.astrologer_amount,
        amount: result.data.astrologer_amount,
        tds_amount: result.data.astrologer_tds_amount,
        main_type: 'cr',
        status: 1,
        admin_amount: result.data.admin_amount,
        admin_percentage: result.data.admin_percentage
      }
    ]);

    return res.json({
      status: 1,
      order_id,
      payment_gateway_status: 0,
      msg: 'Payment Successfully',
      data: result.data,
      customerData
    });

  } catch (error) {
    console.error('/askQuestionPurchase Error:', error);
    return res.status(500).json({
      status: 0,
      msg: 'Internal Server Error',
      error: error.message
    });
  } finally {
    // await updateApiLogs(apiLog.id, req.body);
  }
});
router.post("/askQuestionCustomerList", upload.none(), async (req, res) => {
  // await saveApiLogs(req.body);

  // Validation schema
  const schema = Joi.object({
    api_key: Joi.string().required(),
    customer_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details.map(e => e.message),
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n'),
    });
  }

  const { api_key, customer_uni_id, offset = 0 } = value;

  // Auth check
  const isAuthorized = await checkUserApiKey(api_key, customer_uni_id);
  if (!isAuthorized) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  const limit = constants.api_page_limit;
  const attributes = { ...value, offset, limit };

  try {
    const result = await askQuestionList(attributes);

    for (const res of result) {
      res.customer_img = res.customer_img ? `${req.protocol}://${req.get("host")}/${constants.customer_image_path}/${res.customer_img}` : `${req.protocol}://${req.get("host")}/${constants.default_customer_image_path}`
      res.astro_img = res.astro_img ? `${req.protocol}://${req.get("host")}/${constants.astrologer_image_path}/${res.astro_img}` : `${req.protocol}://${req.get("host")}/${constants.default_astrologer_image_path}`
    }

    if (result && result.length > 0) {
      return res.json({
        status: 1,
        offset: offset + limit,
        data: result,
        msg: 'Get successfully',
      });
    } else {
      return res.json({
        status: 0,
        msg: 'No data found',
      });
    }
  } catch (err) {
    console.error('askQuestionCustomerList Error:', err);
    return res.json({
      status: 0,
      msg: 'Internal server error',
    });
  }
})

router.post("/askQuestionAstrologerList", upload.none(), async (req, res) => {
  // await saveApiLogs(req.body);

  // Validation schema
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details.map(e => e.message),
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n'),
    });
  }

  const { api_key, astrologer_uni_id, offset = 0 } = value;

  // Auth check
  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  const limit = constants.api_page_limit;
  const attributes = { ...value, offset, limit };

  try {
    const result = await askQuestionList(attributes);

    for (const res of result) {
      res.customer_img = res.customer_img ? `${req.protocol}://${req.get("host")}/${constants.customer_image_path}${res.customer_img}` : `${req.protocol}://${req.get("host")}/${constants.default_customer_image_path}`
      res.astro_img = res.astro_img ? `${req.protocol}://${req.get("host")}/${constants.astrologer_image_path}${res.astro_img}` : `${req.protocol}://${req.get("host")}/${constants.default_astrologer_image_path}`
    }

    if (result && result.length > 0) {
      return res.json({
        status: 1,
        offset: offset + limit,
        data: result,
        msg: 'Get successfully',
      });
    } else {
      return res.json({
        status: 0,
        msg: 'No data found',
      });
    }
  } catch (err) {
    console.error('askQuestionAstrologerList Error:', err);
    return res.json({
      status: 0,
      msg: 'Internal server error',
    });
  }
})

router.post("/addAnswerToAskQuestionByAstrologer", upload.none(), async (req, res) => {
  try {

    // Joi validation
    const schema = Joi.object({
      api_key: Joi.string().required(),
      astrologer_uni_id: Joi.string().required(),
      answer: Joi.string().required(),
      ask_question_id: Joi.number().required(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: 0,
        errors: error.details,
        message: 'Something went wrong',
        msg: error.details.map(d => d.message).join('\n'),
      });
    }

    const { api_key, astrologer_uni_id, answer, ask_question_id } = value;

    // Check API Key
    const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    // Fetch question
    const askQuestion = await AskQuestion.findOne({
      where: {
        astrologer_uni_id,
        id: ask_question_id,
      },
    });

    if (!askQuestion) {
      return res.json({
        status: 0,
        msg: 'No data found',
      });
    }

    if (askQuestion.payment_status !== 1) {
      return res.json({
        status: 0,
        msg: 'Payment for this question is not done',
      });
    }

    // Update answer
    await askQuestion.update({
      answer: answer,
      answer_status: 1,
    });

    const updatedQuestion = await AskQuestion.findOne({
      where: {
        astrologer_uni_id,
        id: ask_question_id,
      },
    });
    
    updatedQuestion.dataValues.created_at = updatedQuestion.dataValues.created_at ? dayjs(updatedQuestion.dataValues.created_at).format('YYYY-MM-DD HH:mm:ss'): "N/A";
    updatedQuestion.dataValues.updated_at = updatedQuestion.dataValues.updated_at ? dayjs(updatedQuestion.dataValues.updated_at).format('YYYY-MM-DD HH:mm:ss'): "N/A";

    return res.json({
      status: 1,
      data: updatedQuestion,
      msg: 'Answer added successfully',
    });
  } catch (err) {
    console.error('Error in addAnswerToAskQuestionByAstrologer:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Internal Server Error',
    });
  }
})

router.post("/setAskQuestionPriceByAstrologer", upload.none(), async (req, res) => {
  // let apiLogId;
  try {
    const requestData = req.body;

    // Save API logs
    // apiLogId = await saveapiLogs(requestData);

    // Validate input
    const schema = Joi.object({
      api_key: Joi.string().required(),
      astrologer_uni_id: Joi.string().required(),
      price: Joi.number().required(),
    });

    const { error, value } = schema.validate(requestData);
    if (error) {
      const response = {
        status: 0,
        errors: error.details,
        message: 'Something went wrong',
        msg: error.details.map(e => e.message).join('\n'),
      };
      // if (apiLogId) await updateapiLogs(apiLogId, response);
      return res.status(400).json(response);
    }

    const { api_key, astrologer_uni_id, price } = value;

    // Check API key
    const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isAuthorized) {
      const response = {
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      };
      // if (apiLogId) await updateapiLogs(apiLogId, response);
      return res.status(401).json(response);
    }

    // Find astrologer
    const astrologer = await Astrologer.findOne({ where: { astrologer_uni_id } });

    if (!astrologer) {
      const response = {
        status: 0,
        data: '',
        msg: 'Something went wrong please try again',
      };
      // if (apiLogId) await updateapiLogs(apiLogId, response);
      return res.json(response);
    }

    // Update price
    await astrologer.update({ ask_question_price: price });

    // Get updated data
    // const filter = { astrologer_uni_id };
    // const astroData = await getAstrologerData(filter, 1, req);

    const response = {
      status: 1,
      msg: 'Ask question price updated successfully',
    };
    // if (apiLogId) await updateapiLogs(apiLogId, response);
    return res.json(response);
  } catch (err) {
    console.error('Error in setAskQuestionPriceByAstrologer:', err);
    const response = {
      status: 0,
      msg: 'Internal Server Error',
    };
    // if (apiLogId) await updateapiLogs(apiLogId, response);
    return res.status(500).json(response);
  }
})

router.post("/videoSections", upload.none(), async (req, res) => {
  const schema = Joi.object({
    offset: Joi.number().optional().allow(null, ""),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    const result = {
      status: 0,
      errors: validation.error.details,
      message: "Something went wrong",
      msg: validation.error.details.map((d) => d.message).join("\n")
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const offset = 0;
  let attributes;

  const limit = constants.api_page_limit;

  attributes = {
    ...req.body,
    status: 1,
    offset: Number(offset),
    limit
  };

  if(req.body) {
   let { offset } = req.body;
   attributes = {
    ...req.body,
    status: 1,
    offset: Number(offset),
    limit
  };
  }
  try {

  const videos = await  getVideoSections(attributes)

  for (const video of videos) {
    video.embedd = embed(video.embedd)
    video.embedd = video.embedd ? video.embedd
: ""  }

  const result =
      videos.length > 0
        ? {
            status: 1,
            msg: "Result Found",
            offset: attributes.offset + limit,
            data: videos
          }
        : {
            status: 0,
            msg: "No Record Found"
          };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("Videos Fetch Error:", error);
    const result = {
      status: 0,
      msg: "Internal Server Error"
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

router.post("/serviceCategory", upload.none(), async (req, res) => {
  const schema = Joi.object({
    offset: Joi.number().optional().allow(null, ""),
    search: Joi.optional().allow(null, ""),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    const result = {
      status: 0,
      errors: validation.error.details,
      message: "Something went wrong",
      msg: validation.error.details.map((d) => d.message).join("\n")
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const offset = 0;
  let attributes;

  const limit = constants.api_page_limit;

  attributes = {
    ...req.body,
    status: 1,
    offset: Number(offset),
    limit
  };

  if(req.body) {
   let { offset, search } = req.body;
   attributes = {
    ...req.body,
    status: 1,
    offset: Number(offset),
    limit
  };
  }
  try {

  const servicesCategory = await  ServiceCategory(attributes)

  for (const service of servicesCategory) {

      // const imgPath = path.join('public', constants.banner_image_path || 'uploads/banners/');
      service.image =  service.image
        ? `${req.protocol}://${req.get("host")}/${constants.service_category_image_path}${service.image}`
        : `${req.protocol}://${req.get("host")}/${constants.default_image_path}`;
      
    }

  const result =
      servicesCategory.length > 0
        ? {
            status: 1,
            msg: "Result Found",
            offset: attributes.offset + limit,
            data: servicesCategory
          }
        : {
            status: 0,
            msg: "No Record Found"
          };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("Videos Fetch Error:", error);
    const result = {
      status: 0,
      msg: "Internal Server Error"
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

// router.post("/services", upload.none(), async (req, res) => {
//   // const api = await saveApiLogs(req.body); // Log the request
//   try {
//     const { offset = 0, search = '', slug = '', service_category_id } = req.body;

//     if (!service_category_id) {
//       return res.status(400).json({
//         status: 0,
//         errors: { service_category_id: ['The service_category_id field is required.'] },
//         message: 'Something went wrong',
//         msg: 'The service_category_id field is required.',
//       });
//     }

//     const page_limit = constants.api_page_limit_secondary || 10;

//     const whereClause = {
//       status: '1',
//     };

//     if (slug) {
//       whereClause.slug = slug;
//     }

//     if (service_category_id && Number(service_category_id) > 0) {
//       whereClause.service_category_id = service_category_id;
//     }

//     if (search) {
//       whereClause[Op.or] = [
//         { service_name: { [Op.like]: `%${search}%` } },
//         { service_category_id: { [Op.like]: `%${search}%` } },
//       ];
//     }

//     const services = await Service.findAll({
//       where: whereClause,
//       include: [{
//         model: ServiceCategorys,
//         as: "category",
//         attributes: [],
//       }],
//       offset: parseInt(offset),
//       limit: page_limit,
//       order: [['id', 'DESC']],
//       attributes: ["id", "service_category_id", "service_name", "price", "service_image", "service_image_url", "service_description",[Sequelize.col("category.title"), "title"]]
//     });

//     for (const service of services) {

//       // const imgPath = path.join('public', constants.banner_image_path || 'uploads/banners/');
//       service.service_image =  service.service_image
//         ? `${req.protocol}://${req.get("host")}/${constants.service_image_path}${service.image}`
//         : `${req.protocol}://${req.get("host")}/${constants.default_image_path}`;
      
//     }

//     const result = services.length > 0
//       ? {
//           status: 1,
//           data: services,
//           offset: parseInt(offset) + page_limit,
//           msg: 'Service List',
//         }
//       : {
//           status: 0,
//           msg: 'No Record Found',
//         };

//     // await updateApiLogs(api, result); // Log the response
//     res.json(result);
//   } catch (error) {
//     console.log(error)
//     const result = {
//       status: 0,
//       message: 'Internal Server Error',
//       msg: error.message,
//     };
//     // await updateApiLogs(api, result);
//     res.status(500).json(result);
//   }
// })

router.post('/services', upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  // ✅ Joi Validation
  const schema = Joi.object({
    offset: Joi.number().optional().allow(null, ""),
    search: Joi.string().optional().allow(null, ""),
    slug: Joi.string().optional().allow(null, ""),
    service_category_id: Joi.number().required(),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n'),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const offset = attributes.offset || 0;
  const page_limit = parseInt(process.env.API_PAGE_LIMIT_SECONDARY || 10);

  try {
    // Check cache first (only for non-search queries)
    const cacheKey = {
      category_id: attributes.service_category_id,
      offset: Number(offset),
      limit: Number(page_limit),
      slug: attributes.slug || '',
      search: attributes.search || ''
    };
    
    // Only cache if no search (search results are dynamic)
    if (!attributes.search) {
      const cachedResult = await getFromCache('services', cacheKey);
      if (cachedResult) {
        // Update image URLs with current host
        const records = cachedResult.data || [];
        for (const service of records) {
          service.dataValues.service_image = service.dataValues.service_image
            ? service.dataValues.service_image.replace(/https?:\/\/[^/]+/, `${req.protocol}://${req.get("host")}`)
            : `${req.protocol}://${req.get("host")}/${constants.default_image_path}`;
        }
        return res.json(cachedResult);
      }
    }

    const whereClause = {
      status: 1,
    };

    if (attributes.service_category_id > 0) {
      whereClause.service_category_id = attributes.service_category_id;
    }

    if (attributes.slug) {
      whereClause.slug = attributes.slug;
    }

    if (attributes.search) {
      whereClause[Op.or] = [
        {
          service_name: {
            [Op.like]: `%${attributes.search}%`,
          },
        },
        {
          service_category_id: {
            [Op.like]: `%${attributes.search}%`,
          },
        },
      ];
    }

    const records = await Service.findAll({
      where: whereClause,
      include: [
        {
          model: ServiceCategorys,
          as: "category",
          attributes: [],
        },
      ],
      offset,
      limit: page_limit,
      order: [['id', 'DESC']],
      attributes: ["id", "service_category_id", "service_name", "price", "service_image", "service_image_url", "service_description",[Sequelize.col("category.title"), "title"]]
    });

    
    for (const service of records) {
      service.dataValues.service_image =  service.dataValues.service_image
        ? `${req.protocol}://${req.get("host")}/${constants.service_image_path}${service.dataValues.service_image}`
        : `${req.protocol}://${req.get("host")}/${constants.default_image_path}`;
      
    }

    let result;
    if (records.length) {
      result = {
        status: 1,
        data: records,
        offset: offset + page_limit,
        msg: 'Service List',
      };
    } else {
      result = {
        status: 0,
        msg: 'No Record Found',
      };
    }

    // Cache the result (only if no search)
    if (!attributes.search) {
      await setToCache('services', cacheKey, result, CACHE_TTL.MEDIUM);
    }

    return res.json(result);
  } catch (err) {
    console.error(err);
    const result = {
      status: 0,
      msg: 'Something went wrong',
      error: err.message,
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

router.post("/suggestionsRequest", upload.none(), async (req, res) => {
  // const apiLog = await saveapiLogs(req.body);

  // ✅ Validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    feedback: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
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

  const { api_key, user_uni_id, feedback } = req.body;

  // ✅ API Key Validation
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }

  const dates = new Date()

  // ✅ Insert Suggestion
  try {
    const suggestion = await Suggestion.create({
      user_uni_id,
      feedback,
      image: '',
      status: 1,
      created_at: dates.getFullYear(),
      updated_at: dates.getFullYear()
    });

    // ✅ Send Mail to Admin
    // await sendMailToAdmin(
    //   {
    //     subject: 'Suggestions Request',
    //     content: `User ID : ${user_uni_id}<br>${feedback}`,
    //     template_code: 'default'
    //   },
    //   {
    //     email: config.ceo_email
    //   }
    // );

    const result = {
      status: 1,
      msg: 'Suggestion request saved successfully'
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  } catch (err) {
    const result = {
      status: 0,
      msg: 'Failed to save suggestion',
      error: err.message
    };
    // await updateapiLogs(apiLog, result);
    return res.json(result);
  }
})

router.get('/page_app/:slug', async (req, res) => {
  const { slug } = req.params;
  let data = await Pages.findOne({ where: { default_page: slug } });

  if (!data) {
    data = await Pages.findOne({ where: { page_slug: slug } });
  }

  if (!data) {
    return res.status(404).send('Page not found');
  }

      let logoImgUrl = ""
      const logoImg = getConfig("logo")
      const logoPath = constants.setting_image_path
      if(logoImg && logoPath) {
        logoImgUrl = `${req.protocol}://${req.get("host")}/${logoPath}${logoImg}`
      }

  const html = `<!DOCTYPE html>
<html>

<head>
    <title>${data.page_name ? data.page_name : ""}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
</head>

<body>
    <nav class="navbar navbar-light bg-light">
        <div class="container-fluid">
            <a href="#" class="navbar-brand d-flex align-items-center">
                ${logoImgUrl ? `<img src="${logoImgUrl}" class="img-fluid" alt="${getConfig("company_name")}" style="height: 90px;
    object-fit: contain;">` : `<strong class="fs-4 text-light">${getConfig("company_name")}</strong>`}
            </a>
        </div>
    </nav>
    <section class="All PagesData pt-5 pb-5">
        <div class="container-fluid px-5">
            <div class="row">

                <div class="col-sm-12">

                    <h2 style="text-align: center;font-weight:bold;">
                        ${data.page_name ? data.page_name : ""}
                    </h2><br>

                    ${data.page_description ? data.page_description : ""}
                </div>
            </div>
        </div>
    </section>

</body>

</html>`

  // Example of using a dynamic theme and rendering a Pug, EJS, or Handlebars template
  // const theme = process.env.THEME || 'default';
  // const viewPath = path.join('front_theme', theme, 'home', 'pageApp');


  // res.render(viewPath, { data });
  res.setHeader('Content-Type', 'text/html' )
  res.send(html)
});

router.post("/getFilters", upload.none(), async (req, res) => {
  try {
    const records1 = await Language.findAll({ where: { status: 1 }, attributes: ["id", "language_name"]});
    const records2 = await Skill.findAll({ where: { status: 1 }, attributes: ["id", "skill_name"] });
    const records3 = await Category.findAll({ where: {
        status: 1,
        id: {
          [Op.notIn]: [constants.ARCHITECT_CATEGORY_ID, constants.ELECTRO_HOMOEOPATHY_CATEGORY_ID],
        },
      }, attributes: ["id", "category_title", "category_images"] }); 

    for (const image of records3) {
      image.category_images = image.category_images ?
      `${req.protocol}://${req.get("host")}/${imagePath.CATEGORY_IMAGE_PATH}${image.category_images}`:
      `${req.protocol}://${req.get("host")}/${constants.default_image_path}`
    }
    
    const result = { status: 1, languageList: records1, skillList: records2, categoryList: records3, msg: "Success" }

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (error) {
    console.error("fetch error:", error);
    const result = { status: 0, msg: "Internal Server Error" };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

router.post("/productOrderList", upload.none(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);

  // Joi Validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const validationErrors = {};
    error.details.forEach(detail => {
      validationErrors[detail.path[0]] = [detail.message];
    });

    return res.json({
      status: 0,
      errors: validationErrors,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n'),
    });
  }

  const { api_key, user_uni_id, offset = 0 } = value;

  // Check API Key
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(apiLog, result);
    return res.json(result);
  }

  const limit = constants.api_page_limit_secondary || 10;

  try {
    const orders = await Order.findAll({
      where: {
        user_uni_id,
        payment_status: { [Op.ne]: 'unpaid' },
      },
      include: [
        {
          model: orderProduct,
          as: 'order_products',
          required: true,
          include: [{
            model: Product,
            as: 'product'
          }],
        },
        { model: UserAddress, as: 'address' },
      ],
      order: [['id', 'DESC']],
      offset,
      limit,
    });

    const formattedOrders = orders.map(order => {
      const orderData = order.toJSON();

      orderData.return_valid_date = orderData.return_valid_date ? dayjs(orderData.return_valid_date).format('YYYY-MM-DD HH:mm:ss') : "N/A"
      orderData.created_at = orderData.created_at ? dayjs(orderData.created_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
      orderData.updated_at = orderData.updated_at ? dayjs(orderData.updated_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"

      // Safe check for order_products
      if (orderData.order_products && orderData.order_products.length > 0) {
        orderData.order_products[0].created_at = orderData.order_products[0].created_at ? dayjs(orderData.order_products[0].created_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
        orderData.order_products[0].updated_at = orderData.order_products[0].updated_at ? dayjs(orderData.order_products[0].updated_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
        
        if (orderData.order_products[0].product ) {
          orderData.order_products[0].product.created_at = orderData.order_products[0].product.created_at ? dayjs(orderData.order_products[0].product.created_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
          orderData.order_products[0].product.updated_at = orderData.order_products[0].product.updated_at ? dayjs(orderData.order_products[0].product.updated_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
          orderData.order_products[0].product.product_image = orderData.order_products[0].product.product_image ? `${req.protocol}://${req.get("host")}/uploads/product/${orderData.order_products[0].product.product_image}` : ""
        } else {
          orderData.order_products[0].product = {}
        }
      } else {
        orderData.order_products = []
      }

      // Safe check for address
      if (orderData.address) {
        orderData.address.created_at = orderData.address.created_at ? dayjs(orderData.address.created_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
        orderData.address.updated_at = orderData.address.updated_at ? dayjs(orderData.address.updated_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
      } else {
        orderData.address = {}
      }

      orderData.invoice_url = orderData.invoice_url ? `${req.protocol}://${req.get("host")}/invoice/${order.order_id}` : "N/A";

      if (orderData.order_products) {
        orderData.order_products = orderData.order_products.map(op => {
          if (op.product && 'unit' in op.product) {
            delete op.product.unit;
          }
          return op;
        });
      }

      return orderData;
    });

    const result = formattedOrders.length > 0
      ? {
          status: 1,
          offset: offset + limit,
          data: formattedOrders,
          msg: 'Order list',
        }
      : {
          status: 0,
          msg: 'No Record Found',
        };

    // await updateApiLogs(apiLog, result);
    return res.json(result);
  } catch (err) {
    console.error(err);
    const result = {
      status: 0,
      msg: 'Something went wrong',
    };
    // await updateApiLogs(apiLog, result);
    return res.json(result);
  }
})

router.post("/getWalletHistory", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  // Input Validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Validation failed',
      msg: error.details.map(err => err.message).join('\n'),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, offset = 0 } = value;
  const limit = constants.api_page_limit_secondary || 10;
  req.body.limit = limit;

  // Auth Check
  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  // Fetch Records
  try {
    const records = await getWalletHistory({ user_uni_id, offset, limit });

    for (const record of records) {
      record.created_at = record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
      record.updated_at = record.updated_at ? dayjs(record.updated_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
    }

    const result =
      records && records.length
        ? {
            status: 1,
            msg: 'Success',
            offset: offset + limit,
            data: records,
          }
        : {
            status: 0,
            msg: 'Amount History data Was Empty!',
          };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (err) {
    const result = {
      status: 0,
      msg: 'Server error',
      error: err.message,
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

router.post("/userCallHistory", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  // Validation schema
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    call_type: Joi.string().optional().allow(null, ''),
    status: Joi.string().optional().allow(null, ''),
    offset: Joi.number().integer().min(0).optional(),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n'),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, call_type, status } = value;
  const offset = value.offset || 0;
  const limit = constants.api_page_limit_secondary || 10;

  // API key check
  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  try {
    // Fetch user call history using a helper or a model query
    const requestParams = {
      ...value,
      offset,
      limit,
    };

    const rows = await userCallHistory(requestParams); // Should return an array

    for (const row of rows) {
      row.astro_img = row.astro_img ? `${req.protocol}://${req.get("host")}/${imagePath.astrologer_image_path}${row.astro_img}` : `${req.protocol}://${req.get("host")}/${constants.default_astrologer_image_path}`
    }

    let result;
    if (rows && rows.length > 0) {
      result = {
        status: 1,
        msg: 'Successfully...',
        offset: offset + limit,
        data: rows,
      };
    } else {
      result = {
        status: 0,
        msg: 'Data Not Found...',
      };
    }

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.log(err)
    const result = {
      status: 0,
      msg: 'Server Error',
      error: err.message,
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

router.post("/saveKundliData", upload.none(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    name: Joi.string().when('kundali_type', { is: 'kundli', then: Joi.required() }),
    dob: Joi.string().when('kundali_type', { is: 'kundli', then: Joi.required() }),
    tob: Joi.string().when('kundali_type', { is: 'kundli', then: Joi.required() }),
    lat: Joi.string().when('kundali_type', { is: 'kundli', then: Joi.required() }),
    lon: Joi.string().when('kundali_type', { is: 'kundli', then: Joi.required() }),
    timezone: Joi.string().when('kundali_type', { is: 'kundli', then: Joi.required() }),
    place: Joi.string().when('kundali_type', { is: 'kundli', then: Joi.required() }),
    gender: Joi.string().allow('', null),

    boy_name: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    boy_dob: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    boy_tob: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    boy_tz: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    boy_lat: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    boy_lon: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    boy_place: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    girl_name: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    girl_dob: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    girl_tob: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    girl_tz: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    girl_lat: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    girl_lon: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),
    girl_place: Joi.string().when('kundali_type', { is: 'kundli_matching', then: Joi.required() }),

    kundali_method: Joi.string().required(),
    kundali_type: Joi.string().required(),
    language: Joi.string().optional(),
  });

  const { error, value: attributes } = schema.validate(req.body, { abortEarly: false });

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

  const { api_key, user_uni_id } = attributes;

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

  // Set request body for log
  attributes.request_body = JSON.stringify(attributes);

  delete attributes.api_key;
  delete attributes.language;
  delete attributes.gender;

  if (attributes.kundali_type === 'kundli') {
    delete attributes.dob;
    delete attributes.tob;
    delete attributes.lat;
    delete attributes.lon;
    delete attributes.timezone;
    delete attributes.place;
  } else if (attributes.kundali_type === 'kundli_matching') {
    attributes.name = `${attributes.boy_name} and ${attributes.girl_name}`;
    delete attributes.boy_name;
    delete attributes.boy_dob;
    delete attributes.boy_tob;
    delete attributes.boy_tz;
    delete attributes.boy_lat;
    delete attributes.boy_lon;
    delete attributes.boy_place;
    delete attributes.girl_name;
    delete attributes.girl_dob;
    delete attributes.girl_tob;
    delete attributes.girl_tz;
    delete attributes.girl_lat;
    delete attributes.girl_lon;
    delete attributes.girl_place;
  }

  try {
    const kundli = await UserKundali.create(attributes);

    if (kundli) {
      // const user_data = await getCustomerById(user_uni_id);
      const user_data = await Customer.findOne({
    where: { customer_uni_id: user_uni_id },
    include: [
      {
        model: User,
        as: "user",
        foreignKey: "user_uni_id",
        attributes: []
      },
    ],
     attributes: {
    include: [
      [Sequelize.col('user.role_id'),  'role_id'],
      [Sequelize.col('user.referral_code'), 'referral_code'],
      [Sequelize.col('user.admin_id'), 'admin_id'],
      [Sequelize.col('user.package_uni_id'),  'package_uni_id'],
      [Sequelize.col('user.package_valid_date'), 'package_valid_date'],
      [Sequelize.col('user.name'), 'name'],
      [Sequelize.col('user.email'),  'email'],
      [Sequelize.col('user.username'), 'username'],
      [Sequelize.col('user.password'), 'password'],
      [Sequelize.col('user.password_resets'),  'password_resets'],
      [Sequelize.col('user.pstr'), 'pstr'],
      [Sequelize.col('user.phone'), 'phone'],
      [Sequelize.col('user.country_code'),  'country_code'],
      [Sequelize.col('user.country_name'), 'country_name'],
      [Sequelize.col('user.pan_no'), 'pan_no'],
      [Sequelize.col('user.aadhaar_no'),  'aadhaar_no'],
      [Sequelize.col('user.avg_rating'), 'avg_rating'],
      [Sequelize.col('user.welcome_mail'), 'welcome_mail'],
      [Sequelize.col('user.is_recharge'),  'is_recharge'],
      [Sequelize.col('user.remember_token'), 'remember_token'],
      [Sequelize.col('user.user_fcm_token'), 'user_fcm_token'],
      [Sequelize.col('user.device_token'),  'device_token'],
      [Sequelize.col('user.user_ios_token'), 'user_ios_token'],
      [Sequelize.col('user.firebase_auth_token'), 'firebase_auth_token'],
      [Sequelize.col('user.trash'), 'trash'],
      [Sequelize.col('user.status'),  'status'],
      [Sequelize.col('user.created_at'), 'created_at'],
      [Sequelize.col('user.updated_at'), 'updated_at'],
    ],
  },
  });
      user_data.dataValues.api_key = api_key;

      user_data.dataValues.customer_img = user_data.dataValues.customer_img ? `${req.protocol}://${req.get("host")}/${constants.customer_image_path}${user_data.dataValues.customer_img}`
        : `${req.protocol}://${req.get("host")}/${constants.default_customer_image_path}`;


      const result = {
        status: 1,
        msg: 'Kundli data saved successfully.',
        user_data
      };
      // await updateApiLogs(apiLog, result);
      return res.json(result);
    } else {
      const result = {
        status: 0,
        msg: 'Oops! Something went wrong, please try again.',
        user_data: '',
      };
      // await updateApiLogs(apiLog, result);
      return res.status(500).json(result);
    }
  } catch (err) {
    const result = {
      status: 0,
      msg: 'Server Error',
      error: err.message,
    };
    // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
})

router.post("/userKundaliRequest", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  // JOI validation schema
  const schema = Joi.object({
    offset: Joi.number().integer().min(0).optional(),
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    for_id: Joi.string().required(),
    kundali_method: Joi.string().optional().allow(''), // Make optional to allow fetching all methods
    kundali_type: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const result = {
      status: 0,
      errors: error.details.map((e) => e.message),
      message: "Validation failed",
      msg: error.details.map((e) => e.message).join("\n"),
    };
    // await updateApiLogs(api, result);
    return res.status(400).json(result);
  }

  const {
    offset = 0,
    api_key,
    user_uni_id,
    for_id,
    kundali_method,
    kundali_type,
  } = value;

  // API key authentication
  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  const limit = constants.api_page_limit || 10;

  try {
    // Build where clause - if kundali_method is not provided or empty, fetch all methods
    const whereClause = {
      user_uni_id: for_id,
      kundali_type,
    };
    
    // Only filter by method if it's provided and not empty
    if (kundali_method && kundali_method.trim() !== '') {
      whereClause.kundali_method = kundali_method;
    }
    
    const kundalis = await UserKundali.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      offset: parseInt(offset),
      limit: limit,
    });

    if (kundalis.length > 0) {
      const data = kundalis.map((item) => {
        const obj = item.toJSON();
        try {
          obj.request_body = JSON.parse(obj.request_body || "{}");
        } catch (e) {
          obj.request_body = {};
        }
        return obj;
      });

      const result = {
        status: 1,
        data,
        offset: parseInt(offset) + limit,
        msg: "UserKundali data get successfully",
      };

      // await updateApiLogs(api, result);
      return res.json(result);
    } else {
      const result = {
        status: 0,
        msg: "No record found",
      };
      // await updateApiLogs(api, result);
      return res.json(result);
    }
  } catch (err) {
    const result = {
      status: 0,
      msg: "Something went wrong",
      error: err.message,
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

router.post("/editKundliData", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  // 1. Validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    kundali_method: Joi.string().required(),
    kundali_type: Joi.string().required(),
    id: Joi.number().required(),
    language: Joi.string().allow(null, ''),

    // Kundli fields
    name: Joi.string().when('kundali_type', {
      is: 'kundli',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    dob: Joi.string().when('kundali_type', {
      is: 'kundli',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    tob: Joi.string().when('kundali_type', {
      is: 'kundli',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    lat: Joi.string().when('kundali_type', {
      is: 'kundli',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    lon: Joi.string().when('kundali_type', {
      is: 'kundli',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    timezone: Joi.string().when('kundali_type', {
      is: 'kundli',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    place: Joi.string().when('kundali_type', {
      is: 'kundli',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    gender: Joi.string().optional(),

    // Kundli matching fields
    boy_name: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    boy_dob: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    boy_tob: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    boy_tz: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    boy_lat: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    boy_lon: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    boy_place: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    girl_name: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    girl_dob: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    girl_tob: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    girl_tz: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    girl_lat: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    girl_lon: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    girl_place: Joi.string().when('kundali_type', {
      is: 'kundli_matching',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Validation failed',
      msg: error.details.map(e => e.message).join('\n')
    };
    // await updateApiLogs(api, result);
    return res.status(400).json(result);
  }

  const attributes = { ...value };
  const { api_key, user_uni_id, id, kundali_type } = attributes;

  if (!checkUserApiKey(api_key, user_uni_id)) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  const userKundali = await UserKundali.findOne({ where: { id } });
  if (!userKundali) {
    const result = { status: 0, msg: 'No record found' };
    // await updateApiLogs(api, result);
    return res.status(404).json(result);
  }

  // Prepare update fields
  delete attributes.api_key;
  delete attributes.id;
  delete attributes.language;
  delete attributes.gender;

  let updateFields = {};

  if (kundali_type === 'kundli_matching') {
    attributes.name = `${attributes.boy_name} and ${attributes.girl_name}`;
    updateFields = {
      name: attributes.name,
    };
  }

  const updatedData = {
    ...attributes,
    request_body: JSON.stringify(req.body),
  };

  const updated = await UserKundali.update(updatedData, { where: { id } });

  if (updated[0] > 0) {
    const userData = await Customer.findOne({
    where: { customer_uni_id: user_uni_id },
    include: [
      {
        model: User,
        as: "user",
        foreignKey: "user_uni_id",
        attributes: []
      },
    ],
     attributes: {
    include: [
      [Sequelize.col('user.role_id'),  'role_id'],
      [Sequelize.col('user.referral_code'), 'referral_code'],
      [Sequelize.col('user.admin_id'), 'admin_id'],
      [Sequelize.col('user.package_uni_id'),  'package_uni_id'],
      [Sequelize.col('user.package_valid_date'), 'package_valid_date'],
      [Sequelize.col('user.name'), 'name'],
      [Sequelize.col('user.email'),  'email'],
      [Sequelize.col('user.username'), 'username'],
      [Sequelize.col('user.password'), 'password'],
      [Sequelize.col('user.password_resets'),  'password_resets'],
      [Sequelize.col('user.pstr'), 'pstr'],
      [Sequelize.col('user.phone'), 'phone'],
      [Sequelize.col('user.country_code'),  'country_code'],
      [Sequelize.col('user.country_name'), 'country_name'],
      [Sequelize.col('user.pan_no'), 'pan_no'],
      [Sequelize.col('user.aadhaar_no'),  'aadhaar_no'],
      [Sequelize.col('user.avg_rating'), 'avg_rating'],
      [Sequelize.col('user.welcome_mail'), 'welcome_mail'],
      [Sequelize.col('user.is_recharge'),  'is_recharge'],
      [Sequelize.col('user.remember_token'), 'remember_token'],
      [Sequelize.col('user.user_fcm_token'), 'user_fcm_token'],
      [Sequelize.col('user.device_token'),  'device_token'],
      [Sequelize.col('user.user_ios_token'), 'user_ios_token'],
      [Sequelize.col('user.firebase_auth_token'), 'firebase_auth_token'],
      [Sequelize.col('user.trash'), 'trash'],
      [Sequelize.col('user.status'),  'status'],
      [Sequelize.col('user.created_at'), 'created_at'],
      [Sequelize.col('user.updated_at'), 'updated_at'],
    ],
  },
  });

  userData.dataValues.api_key = api_key;

      userData.dataValues.customer_img = userData.dataValues.customer_img ? `${req.protocol}://${req.get("host")}/${constants.customer_image_path}${userData.dataValues.customer_img}`
        : `${req.protocol}://${req.get("host")}/${constants.default_customer_image_path}`;

    const result = {
      status: 1,
      msg: 'Kundli data updated successfully.',
      user_data: userData,
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  } else {
    const result = {
      status: 0,
      msg: 'Oops! Something is wrong please try again.',
      user_data: '',
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
})

router.post("/deleteKundali", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  // 1. Validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    id: Joi.number().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n'),
    };
    // await updateApiLogs(api, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id, id } = value;

  // 2. Authorization
  if (!checkUserApiKey(api_key, user_uni_id)) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  // 3. Find & delete kundali record
  const kundali = await UserKundali.findOne({ where: { id } });

  let result;
  if (kundali) {
    await UserKundali.destroy({ where: { id } });
    result = {
      status: 1,
      msg: 'User kundali deleted successfully',
    };
  } else {
    result = {
      status: 0,
      msg: 'No record Found',
    };
  }

  // await updateApiLogs(api, result);
  return res.json(result);
})

router.post("/getKundaliChart", upload.none(), async (req, res) => {
  // Validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    id: Joi.number().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Validation failed',
      msg: error.details.map(e => e.message).join('\n'),
    });
  }

  const { api_key, user_uni_id, id } = value;

  // Authorization
  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    // Find kundali record
    const kundali = await UserKundali.findOne({ where: { id, user_uni_id } });
    
    if (!kundali) {
      return res.json({
        status: 0,
        msg: 'Kundali not found',
      });
    }

    // Parse request_body to get birth details
    let requestBody = {};
    try {
      requestBody = kundali.request_body ? JSON.parse(kundali.request_body) : {};
    } catch (e) {
      requestBody = {};
    }

    // Check if we have required data for chart generation
    if (!requestBody.dob || !requestBody.tob || !requestBody.lat || !requestBody.lon) {
      console.error('[getKundaliChart] Missing required fields:', {
        hasDob: !!requestBody.dob,
        hasTob: !!requestBody.tob,
        hasLat: !!requestBody.lat,
        hasLon: !!requestBody.lon,
        requestBodyKeys: Object.keys(requestBody)
      });
      return res.json({
        status: 0,
        msg: 'Incomplete birth details for chart generation',
        debug: {
          hasDob: !!requestBody.dob,
          hasTob: !!requestBody.tob,
          hasLat: !!requestBody.lat,
          hasLon: !!requestBody.lon
        }
      });
    }

    // Import generateVedicAstroKundaliChart (now exported)
    const { generateVedicAstroKundaliChart } = await import('../_helpers/openaicommon.js');
    
    // Prepare user data for chart generation
    const userData = {
      dob: requestBody.dob,
      tob: requestBody.tob,
      lat: requestBody.lat,
      lon: requestBody.lon,
      tz: requestBody.timezone || requestBody.tz || '5.5',
      name: kundali.name || requestBody.name || '',
      gender: requestBody.gender || '',
    };

    // Generate chart
    console.log('[getKundaliChart] User data for chart generation:', {
      dob: userData.dob,
      tob: userData.tob,
      lat: userData.lat,
      lon: userData.lon,
      tz: userData.tz
    });
    
    let chartResult;
    try {
      chartResult = await generateVedicAstroKundaliChart(userData);
    } catch (chartError) {
      console.error('[getKundaliChart] Error calling generateVedicAstroKundaliChart:', chartError);
      console.error('[getKundaliChart] Error stack:', chartError.stack);
      return res.json({
        status: 0,
        msg: 'Error generating chart: ' + (chartError.message || 'Unknown error'),
      });
    }
    
    console.log('[getKundaliChart] Chart result:', {
      hasResult: !!chartResult,
      hasChartImage: !!(chartResult && chartResult.chartImage),
      chartImageType: chartResult && chartResult.chartImage ? typeof chartResult.chartImage : 'N/A',
      chartImageLength: chartResult && chartResult.chartImage ? (typeof chartResult.chartImage === 'string' ? chartResult.chartImage.length : 'not string') : 'N/A'
    });

    if (chartResult && chartResult.chartImage) {
      // Check if chartImage is a string (SVG or base64) or an object
      let chartImageData = chartResult.chartImage;
      
      // If it's an object, try to extract the image data
      if (typeof chartImageData === 'object') {
        // Check common response structures
        if (chartImageData.data) {
          chartImageData = chartImageData.data;
        } else if (chartImageData.image) {
          chartImageData = chartImageData.image;
        } else if (chartImageData.svg) {
          chartImageData = chartImageData.svg;
        } else if (chartImageData.chart) {
          chartImageData = chartImageData.chart;
        } else {
          // Try to stringify if it's a valid object
          chartImageData = JSON.stringify(chartImageData);
        }
      }
      
      // Ensure it's a string
      if (typeof chartImageData !== 'string') {
        console.error('[getKundaliChart] Chart image is not a string:', typeof chartImageData);
        return res.json({
          status: 0,
          msg: 'Invalid chart image format',
        });
      }
      
      return res.json({
        status: 1,
        msg: 'Chart generated successfully',
        chart_image: chartImageData,
        kundali_data: {
          id: kundali.id,
          name: kundali.name,
          method: kundali.kundali_method,
          type: kundali.kundali_type,
        }
      });
    } else {
      console.error('[getKundaliChart] Chart generation failed:', {
        hasResult: !!chartResult,
        result: chartResult
      });
      return res.json({
        status: 0,
        msg: 'Failed to generate chart. Please try again.',
        debug: chartResult ? 'Chart result exists but no chartImage' : 'No chart result returned'
      });
    }
  } catch (err) {
    console.error('getKundaliChart error:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Server Error',
      error: err.message,
    });
  }
})

router.post('/customerServiceOrder', upload.none(), async (req, res) => {
  try {
    const { api_key, user_uni_id, offset = 0, limit = 15 } = req.body;

    if (!api_key || !user_uni_id) {
      return res.status(400).json({ status: 0, msg: 'Missing required fields.' });
    }

    const isValid = await checkUserApiKey(api_key, user_uni_id);
    if (!isValid) {
      return res.json({ status: 0, msg: 'Invalid API Key.' });
    }

    const orders = await ServiceOrder.findAll({
      where: {
        customer_uni_id: user_uni_id,
        status: { [Op.in]: ['pending', 'approved'] },
        payment_status: { [Op.in]: ['unpaid', 'paid'] },
      },
      include: [
        {
          model: ServiceAssign,
          as: 'service_assign',
          include: [
            {
              model: Service,
              as: 'services',
              attributes: [
                'id',
                'service_category_id',
                'service_name',
                'slug',
                'service_image',
                'service_description',
              ],
            },
          ],
        },
        {
          model: User,
          as: 'user_astrologer',
          attributes: [
            'id',
            'user_uni_id',
            'name',
            'user_fcm_token',
            'user_ios_token',
            'avg_rating',
          ],
        },
        {
          model: Astrologer,
          as: 'astrologer',
          attributes: ['id', 'astrologer_uni_id', 'display_name', 'slug', 'astro_img'],
        },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['id', 'DESC']],
    });

    if (!orders || orders.length === 0) {
      return res.json({ status: 0, msg: 'No orders found.' });
    }

    const baseServiceUrl = `${req.protocol}://${req.get('host')}/uploads/service/`;
    const baseAstrologerUrl = `${req.protocol}://${req.get('host')}/uploads/astrologer/`;

    const formattedOrders = orders.map(order => {
      const serviceAssign = order.service_assign || {};
      const service = serviceAssign.service || {};
      const userAstrologer = order.user_astrologer || {};
      const astrologer = order.astrologer || {};

      return {
        id: order.id,
        service_assign_id: order.service_assign_id,
        customer_uni_id: order.customer_uni_id,
        astrologer_uni_id: order.astrologer_uni_id,
        order_id: order.order_id,
        price: order.price || 0,
        available_duration: order.available_duration || 0,
        start_time: order.start_time,
        date: order.date || '',
        time: order.time || '',
        file_type: order.file_type || null,
        file_url: order.file_url || null,
        status: order.status,
        payment_status: order.payment_status || 'unpaid',
        is_notified: order.is_notified || 0,
        on_pause: order.on_pause || 0,
        refund_valid_date: order.refund_valid_date || null,
        created_at: order.created_at
          ? moment(order.created_at).format('YYYY-MM-DD HH:mm:ss')
          : null,
        updated_at: order.updated_at
          ? moment(order.updated_at).format('YYYY-MM-DD HH:mm:ss')
          : null,
        is_available: order.is_available || 0,
        service_assign: {
          id: serviceAssign.id || null,
          service_id: serviceAssign.service_id || null,
          astrologer_uni_id: serviceAssign.astrologer_uni_id || null,
          price: serviceAssign.price || 0,
          actual_price: serviceAssign.actual_price || 0,
          description: serviceAssign.description || '',
          duration: serviceAssign.duration || 0,
          status: serviceAssign.status || 0,
          created_at: serviceAssign.created_at 
            ? moment(serviceAssign.created_at).format('YYYY-MM-DD HH:mm:ss')
            : null,
          updated_at: serviceAssign.updated_at
            ? moment(serviceAssign.updated_at).format('YYYY-MM-DD HH:mm:ss')
            : null,
          service: {
            id: service.id || null,
            service_category_id: service.service_category_id || null,
            service_name: service.service_name || '',
            slug: service.slug || '',
            service_image: service.service_image
              ? `${baseServiceUrl}${service.service_image}`
              : null,
            service_description: service.service_description || '',
          },
        },
        user_astrologer: {
          id: userAstrologer.id,
          user_uni_id: userAstrologer.user_uni_id,
          name: userAstrologer.name,
          user_fcm_token: userAstrologer.user_fcm_token,
          user_ios_token: userAstrologer.user_ios_token,
          avg_rating: userAstrologer.avg_rating,
        },
        astrologer: {
          id: astrologer.id,
          astrologer_uni_id: astrologer.astrologer_uni_id,
          display_name: astrologer.display_name,
          slug: astrologer.slug,
          astro_img: astrologer.astro_img
            ? `${baseAstrologerUrl}${astrologer.astro_img}`
            : null,
        },
      };
    });

    return res.json({
      status: 1,
      offset: parseInt(offset) + parseInt(limit),
      data: formattedOrders,
      msg: 'Customer Service Order List',
    });
  } catch (err) {
    console.error('Error in customerServiceOrder:', err);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error', error: err.message });
  }
});

router.post("/customerAnonymousReviewStatusChange", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    is_anonymous_review: Joi.number().valid(0, 1).optional(),
  });

  const { error, value: attributes } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((err) => err.message).join("\n"),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, is_anonymous_review = 0 } = attributes;

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

  try {
    const customer = await Customer.findOne({ where: { customer_uni_id: user_uni_id } });

    if (!customer) {
      const result = {
        status: 0,
        msg: "Invalid customer",
      };
      //await updateApiLogs(api, result);
      return res.json(result);
    }

    await customer.update({ is_anonymous_review });

    const filterObj = { user_uni_id };
    const data = await getUserData(filterObj, true);

    const result = data
      ? {
          status: 1,
          msg: "Status updated successfully",
          data,
        }
      : {
          status: 0,
          msg: "Something Went wrong.. Try Again",
        };

    // await updateApiLogs(api, result);
    return res.json(result);

  } catch (err) {
    console.error(err);
    const result = {
      status: 0,
      msg: "Internal server error",
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }
})

router.post("/userGiftHistory", upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    livechannel: Joi.string().optional().allow(null, ''),
    gift_type: Joi.string().optional().allow(null, ''),
    offset: Joi.number().integer().min(0).optional().allow(null, ''),
  });

  const { error, value: attributes } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: "Something went wrong",
      msg: error.details.map((err) => err.message).join("\n"),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id, offset = 0, livechannel, gift_type } = attributes;

  // const isValid = await checkUserApiKey(api_key, user_uni_id);
  // if (!isValid) {
  //   const result = {
  //     status: 0,
  //     error_code: 101,
  //     msg: "Unauthorized User... Please login again",
  //   };
  //   // await updateApiLogs(api, result);
  //   return res.json(result);
  // }

  const page_limit = constants.api_page_limit_secondary;

  // Prepare query params for userGiftHistory
  const queryParams = {
    ...attributes,
    limit: page_limit,
    offset,
  };

  try {
    const records = await userGiftHistory(queryParams); // Should return an array or Sequelize result

    for (const record of records) {

      record.dataValues.created_at = record.dataValues.created_at ? dayjs(record.dataValues.created_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
      record.dataValues.updated_at = record.dataValues.updated_at ? dayjs(record.dataValues.updated_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"

      record.gift.dataValues.created_at = record.gift.dataValues.created_at ? dayjs(record.gift.dataValues.created_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
      record.gift.dataValues.updated_at = record.gift.dataValues.updated_at ? dayjs(record.gift.dataValues.updated_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"

      record.gift.dataValues.gift_image = record.gift.dataValues.gift_image ? `${req.protocol}://${req.get("host")}/uploads/gift/${record.gift.dataValues.gift_image}` : ""
      record.astrologer.dataValues.astro_img = record.astrologer.dataValues.astro_img ? `${req.protocol}://${req.get("host")}/uploads/astrologer/${record.astrologer.dataValues.astro_img}` : ""
    }

    const result = Array.isArray(records) && records.length > 0
      ? {
          status: 1,
          msg: "Success",
          offset: offset + page_limit,
          data: records,
        }
      : {
          status: 0,
          msg: "Amount History data Was Empty!",
        };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error(err);
    const result = {
      status: 0,
      msg: "Internal server error",
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }
})

router.post('/changeCustomerReviewStatus', upload.none(), async (req, res) => {
  // const api = saveapiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    review_id: Joi.number().required(),
    status: Joi.number().valid(0, 1).required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const msg = error.details.map((err) => err.message).join('\n');
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg,
    });
  }

  const { api_key, user_uni_id, review_id, status } = value;

  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // updateapiLogs(api, result);
    return res.json(result);
  }

  const review = await Reviews.findOne({
    where: {
      review_for_id: user_uni_id,
      id: review_id,
    },
  });

  let result;

  if (review) {
    await review.update({ status });

    const msg = status === 1 ? 'Review active successfully' : 'Review in-active successfully';
    result = {
      status: 1,
      msg,
    };
  } else {
    result = {
      status: 0,
      msg: 'No Record Found',
    };
  }

  // updateapiLogs(api, result);
  return res.json(result);
})

router.post('/customerReviewDelete', upload.none(), async (req, res) => {
  // const api = saveapiLogs(req.body);

  // Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    review_id: Joi.number().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const msg = error.details.map((err) => err.message).join('\n');
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg,
    });
  }

  const { api_key, user_uni_id, review_id } = value;

  // Check user auth
  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // updateapiLogs(api, result);
    return res.json(result);
  }

  // Find the review
  const review = await Reviews.findOne({
    where: {
      review_for_id: user_uni_id,
      id: review_id,
    },
  });

  let result;

  if (review) {
    await review.destroy(); // Sequelize delete
    result = {
      status: 1,
      msg: 'Review deleted successfully',
    };
  } else {
    result = {
      status: 0,
      msg: 'No Record Found',
    };
  }

  // updateapiLogs(api, result);
  return res.json(result);
})

router.post('/assignService', upload.none(), async (req, res) => {
  // const api = saveapiLogs(req.body);

  // Joi validation
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    service_id: Joi.number().required(),
    duration: Joi.string().required(),
    price: Joi.number().required(),
    actual_price: Joi.number().optional().allow(null),
    description: Joi.string().optional().allow(null, ''),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const msg = error.details.map((err) => err.message).join('\n');
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg,
    });
  }

  const {
    api_key,
    astrologer_uni_id,
    service_id,
    duration,
    price,
    actual_price = 0,
    description = '',
  } = value;

  try {
    // Check if already assigned
    const existing = await ServiceAssign.findOne({
      where: {
        astrologer_uni_id,
        service_id,
      },
    });

    let result;

    if (!existing) {
      const newAssign = await ServiceAssign.create({
        service_id,
        astrologer_uni_id,
        price,
        actual_price,
        description,
        duration,
      });

      result = {
        status: 1,
        data: newAssign,
        msg: 'ServiceAssign List',
      };
    } else {
      result = {
        status: 0,
        msg: 'Already Select This Assign Service',
      };
    }

    // updateapiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error('assignService error:', err);
    const result = {
      status: 0,
      msg: 'Internal Server Error',
    };
    // updateapiLogs(api, result);
    return res.json(result);
  }
})

router.post('/removeService', upload.none(), async (req, res) => {
  // const api = saveapiLogs(req.body);

  // Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    service_assign_id: Joi.number().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const msg = error.details.map((err) => err.message).join('\n');
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg,
    });
  }

  const { api_key, astrologer_uni_id, service_assign_id } = value;

  try {
    // Auth check
    if (!checkUserApiKey(api_key, astrologer_uni_id)) {
      const result = {
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      };
      return res.json(result);
    }

    const serviceAssign = await ServiceAssign.findByPk(service_assign_id);

    let result;
    if (serviceAssign) {
      const deleted = await serviceAssign.destroy();
      if (deleted) {
        result = {
          status: 1,
          msg: 'Service deleted successfully',
        };
      } else {
        result = {
          status: 0,
          msg: 'Something went wrong',
        };
      }
    } else {
      result = {
        status: 0,
        msg: 'Invalid Service',
      };
    }

    // updateapiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error('removeService error:', err);
    const result = {
      status: 0,
      msg: 'Internal Server Error',
    };
    // updateapiLogs(api, result);
    return res.json(result);
  }
})

router.post('/astroGiftHistory', upload.none(), async (req, res) => {
  // const api = saveapiLogs(req.body);

  // Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    livechannel: Joi.string().optional().allow('', null),
    gift_type: Joi.string().optional().allow('', null),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    const msg = error.details.map((err) => err.message).join('\n');
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg,
    });
  }

  const { api_key, astrologer_uni_id, livechannel, gift_type } = value;

  try {
    // Check API Key
    if (!checkUserApiKey(api_key, astrologer_uni_id)) {
      const result = {
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      };
      return res.json(result);
    }

    // Call helper function to fetch gift history
    const attributes = { api_key, astrologer_uni_id, livechannel, gift_type };
    const records = await astroGiftHistory(attributes);

    

    let result;
    if (records && records.length > 0) {

      for (const record of records) {
      record.gift.dataValues.gift_image = record.gift.dataValues.gift_image ? `${req.protocol}://${req.get("host")}/uploads/gift/${record.gift.dataValues.gift_image}` : ""
      record.customer.dataValues.customer_img = record.customer.dataValues.customer_img ? `${req.protocol}://${req.get("host")}/uploads/astrologer/${record.customer.dataValues.customer_img}` : ""
    }
      result = {
        status: 1,
        msg: 'Success',
        data: records,
      };
    } else {
      result = {
        status: 0,
        msg: 'Amount History data Was Empty!',
      };
    }

    // updateapiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error('astroGiftHistory error:', err);
    const result = {
      status: 0,
      msg: 'Internal Server Error',
    };
    // updateapiLogs(api, result);
    return res.json(result);
  }
})

router.post('/addPredefinedMessage', upload.none(), async (req, res) => {
  // const apiLogId = await saveApiLogs(req.body); 

  // 1. Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    message: Joi.string().allow('', null),
    message_type: Joi.string().optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const msg = error.details.map(err => err.message).join('\n');
    const result = { status: 0, errors: error.details, message: 'Something went wrong', msg };
    // await updateApiLogs(apiLogId, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id, message, message_type } = value;

  // 2. Check user API key validity
  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(apiLogId, result);
    return res.status(401).json(result);
  }

  try {
    // 3. Check max predefined message count
    const maxAllowed = Number(constants.MAX_ALLOWED_PREDEFINED_MSG || 10);
    const existingCount = await PredefinedMessage.count({ where: { user_uni_id } });

    if (existingCount >= maxAllowed) {
      const result = {
        status: 0,
        msg: `Maximum ${maxAllowed} predefined messages are allowed.`,
      };
      // await updateApiLogs(apiLogId, result);
      return res.status(200).json(result);
    }

    // 4. Create predefined message
    const newMessage = await PredefinedMessage.create({
      user_uni_id,
      message,
      message_type: message_type || 'chat',
      created_by: 'Astrologer',
      status: 1,
    });

    const result = {
      status: 1,
      predefined_messages: newMessage,
      msg: 'Added successfully',
    };
    // await updateApiLogs(apiLogId, result);
    return res.status(200).json(result);
  } catch (err) {
    console.error('addPredefinedMessage error:', err);
    const result = { status: 0, msg: 'Something went wrong' };
    // await updateApiLogs(apiLogId, result);
    return res.status(500).json(result);
  }
})

router.post('/deletePredefinedMessage', upload.none(), async (req, res) => {
  // const apiLogId = await saveApiLogs(req.body);

  // 1. Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    id: Joi.number().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const msg = error.details.map(err => err.message).join('\n');
    const result = { status: 0, errors: error.details, message: 'Something went wrong', msg };
    // await updateApiLogs(apiLogId, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id, id } = value;

  // 2. Authenticate
  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(apiLogId, result);
    return res.status(401).json(result);
  }

  try {
    // 3. Check if message exists
    const existingMessage = await PredefinedMessage.findOne({
      where: { user_uni_id, id },
    });

    let result;
    if (existingMessage) {
      await PredefinedMessage.destroy({ where: { id } });
      result = {
        status: 1,
        msg: 'Predefined Message deleted successfully',
      };
    } else {
      result = {
        status: 0,
        msg: 'No Record Found',
      };
    }

    // await updateApiLogs(apiLogId, result);
    return res.status(200).json(result);
  } catch (err) {
    console.error('deletePredefinedMessage error:', err);
    const result = { status: 0, msg: 'Something went wrong' };
    // await updateApiLogs(apiLogId, result);
    return res.status(500).json(result);
  }
})

router.post('/trainingVideoList', upload.none(), async (req, res) => {
  // const apiLogId = await saveApiLogs(req.body);

  // 1. Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    user_type: Joi.string().required(),
    offset: Joi.number().optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const msg = error.details.map(err => err.message).join('\n');
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg,
    };
    // await updateApiLogs(apiLogId, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id, user_type } = value;
  const offset = value.offset || 0;
  const page_limit = constants.api_page_limit || 10;

  // 2. Auth Check
  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(apiLogId, result);
    return res.status(401).json(result);
  }

  try {
    // 3. Fetch video list
    const resultData = await trainingVideoList({
      ...value,
      offset,
      limit: page_limit,
    });

  //   for (const video of resultData) {
  //     video.embedd = embed(video.url)
  //     video.embedd = video.embedd ? video.embedd
  // : ""  }

    const result = resultData && resultData.length
      ? {
          status: 1,
          offset: offset + page_limit,
          data: resultData,
          msg: 'Get successfully',
        }
      : {
          status: 0,
          data: '',
          msg: 'No data found',
        };

    // await updateApiLogs(apiLogId, result);
    return res.status(200).json(result);
  } catch (err) {
    console.error('trainingVideoList error:', err);
    const result = { status: 0, msg: 'Something went wrong' };
    // await updateApiLogs(apiLogId, result);
    return res.status(500).json(result);
  }
})

router.post('/getFollowers', upload.none(), async (req, res) => {
  // const api = await saveApiLogs(req.body);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().optional().allow('', null),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n'),
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const { api_key, user_uni_id } = attributes;
  const offset = parseInt(attributes.offset || 0);
  const page_limit = parseInt(constants.api_page_limit_secondary || 10);

  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const followers = await getFollowers({
    user_uni_id,
    limit: page_limit,
    offset,
  });

  let result;
  if (followers.length) {

    for (const follower of followers) {
      follower.dataValues.customer_img = follower.dataValues.customer_img ? `${req.protocol}://${req.get("host")}/${constants.customer_image_path}${follower.dataValues.customer_img}` : `${req.protocol}://${req.get("host")}/${constants.default_customer_image_path}`
      follower.dataValues.astrologer_img = follower.dataValues.astrologer_img ? `${req.protocol}://${req.get("host")}/${constants.astrologer_image_path}${follower.dataValues.astrologer_img}` : `${req.protocol}://${req.get("host")}/${constants.default_astrologer_image_path}`
    }

    result = {
      status: 1,
      offset: offset + page_limit,
      data: followers,
      msg: 'Get successfully',
    };
  } else {
    result = {
      status: 0,
      data: [],
      msg: 'No data found',
    };
  }

  // await updateApiLogs(api, result);
  return res.json(result);
})

router.post('/serviceActive', upload.none(), async (req, res) => {
  // const apiLog = await saveApiLogs(req.body);

  // Step 1: Validate input
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    service_assign_id: Joi.number().required(),
    status: Joi.number().valid(0, 1).required()
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

  const { api_key, astrologer_uni_id, service_assign_id, status } = value;

  // Step 2: API key auth check
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

  // Step 3: Fetch & update ServiceAssign
  const serviceAssign = await ServiceAssign.findByPk(service_assign_id);

  if (!serviceAssign) {
    const result = {
      status: 0,
      msg: 'Invalid Service'
    };
    // await updateApiLogs(apiLog, result);
    return res.status(404).json(result);
  }

  try {
    await serviceAssign.update({ status });

    const msg = status === 1 ? 'Active' : 'Inactive';
    const result = {
      status: 1,
      msg: `Service ${msg} successfully`
    };
    // await updateApiLogs(apiLog, result);
    return res.json(result);
  } catch (err) {
    const result = {
      status: 0,
      msg: 'Something went wrong'
    };
    // await updateApiLogs(apiLog, result);
    return res.status(500).json(result);
  }
});

router.post('/astrologerServiceOrder', upload.none(), async (req, res) => {
  try {
    // Save API logs
    // await saveApiLogs(req.body);

    const schema = Joi.object({
      api_key: Joi.string().required(),
      astrologer_uni_id: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.json({
        status: 0,
        errors: error.details.map(d => d.message),
        message: 'Something went wrong',
        msg: error.details.map(d => d.message).join('\n')
      });
    }

    const { api_key, astrologer_uni_id } = value;

    const isValidUser = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isValidUser) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

    const astrologer_service = await astrologerServiceOrder(req);
    
      for (const astrologer_services of astrologer_service) {
      // Add customer image path
      if (astrologer_services.customer && astrologer_services.customer.customer_img) {
        astrologer_services.customer.customer_img = `${req.protocol}://${req.get("host")}/${constants.customer_image_path}${astrologer_services.customer.customer_img}`;
      } else {
        astrologer_services.customer.customer_img = `${req.protocol}://${req.get("host")}/${constants.default_customer_image_path}`;
      }
      
      // Add service image path
      if (astrologer_services.service_assign && astrologer_services.service_assign.service && astrologer_services.service_assign.service.service_image) {
        astrologer_services.service_assign.service.service_image = `${req.protocol}://${req.get("host")}/${constants.service_image_path}${astrologer_services.service_assign.service.service_image}`;
      } else {
        astrologer_services.service_assign.service.service_image = `${req.protocol}://${req.get("host")}/${constants.default_image_path}`;
      }
    }

    
    if (astrologer_service && astrologer_service.length > 0) {
      return res.json({
        status: 1,
        data: astrologer_service,
        msg: 'Astrologer Service Order List'
      });
    } else {
      return res.json({
        status: 0,
        msg: 'Something went wrong.'
      });
    }
  } catch (err) {
    console.error('astrologerServiceOrder error:', err);
    return res.json({
      status: 0,
      msg: 'Something went wrong. Internal server error.'
    });
  }
});

/**
 * Submit Contact Form
 * Public API - No authentication required
 */
router.post("/submitContact", upload.none(), async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required().max(255).messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().max(255).messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
    number: Joi.string().optional().allow('').max(255),
    subject: Joi.string().required().max(255).messages({
      'string.empty': 'Subject is required',
      'any.required': 'Subject is required'
    }),
    message: Joi.string().required().messages({
      'string.empty': 'Message is required',
      'any.required': 'Message is required'
    }),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  const { name, email, number, subject, message } = value;

  try {
    const { default: Contact } = await import("../_models/contacts.js");

    const newContact = await Contact.create({
      name,
      email,
      number: number || null,
      subject,
      message,
      status: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('[submitContact] Contact form submitted:', { id: newContact.id, name, email, subject });

    return res.json({
      status: 1,
      msg: "Thank you for contacting us! We will get back to you soon.",
      data: {
        id: newContact.id,
        name: newContact.name,
        email: newContact.email,
      },
    });
  } catch (err) {
    console.error("submitContact error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong. Please try again later.",
      error: err.message,
    });
  }
});

/**
 * Get Contact Departments
 * Public API - No authentication required
 * Returns list of departments for contact form dropdown
 */
router.post("/getContactDepartments", upload.none(), async (req, res) => {
  try {
    const { default: ContactDepartment } = await import("../_models/contactDepartments.js");

    const departments = await ContactDepartment.findAll({
      attributes: ['id', 'title', 'email_id'],
      order: [['title', 'ASC']],
    });

    return res.json({
      status: 1,
      msg: "Contact departments fetched successfully",
      data: departments,
    });
  } catch (err) {
    console.error("getContactDepartments error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get Cover Images
 * Public API - No authentication required
 * Returns list of cover images for profile/background selection
 */
router.post("/getCoverImages", upload.none(), async (req, res) => {
  try {
    const { default: CoverImage } = await import("../_models/coverImages.js");

    const coverImages = await CoverImage.findAll({
      where: { status: '1' },
      attributes: ['id', 'cover_img'],
      order: [['id', 'DESC']],
    });

    return res.json({
      status: 1,
      msg: "Cover images fetched successfully",
      data: coverImages,
    });
  } catch (err) {
    console.error("getCoverImages error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get Currencies List
 * Public API - No authentication required
 * Returns list of active currencies with exchange rates
 */
router.post("/getCurrencies", upload.none(), async (req, res) => {
  try {
    const { default: CurrencyModel } = await import("../_models/currencies.js");

    const currencies = await CurrencyModel.findAll({
      where: { status: 1 },
      attributes: ['id', 'title', 'currency_code', 'currency_symbol', 'country_code', 'exchange_rate', 'default_status'],
      order: [['default_status', 'DESC'], ['title', 'ASC']],
    });

    return res.json({
      status: 1,
      msg: "Currencies fetched successfully",
      data: currencies,
    });
  } catch (err) {
    console.error("getCurrencies error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get Customer Refunds
 * Requires authentication
 * Returns list of refund requests for a user
 */
router.post("/getCustomerRefunds", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().optional().default(0),
    limit: Joi.number().optional().default(20),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: "Validation error",
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  const { api_key, user_uni_id, offset, limit } = value;

  if (!(await checkUserApiKey(api_key, user_uni_id))) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    });
  }

  try {
    const { default: CustomerRefund } = await import("../_models/customerRefunds.js");

    const refunds = await CustomerRefund.findAndCountAll({
      where: { user_id: user_uni_id },
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      status: 1,
      msg: "Customer refunds fetched successfully",
      data: refunds.rows,
      total: refunds.count,
      offset,
      limit,
    });
  } catch (err) {
    console.error("getCustomerRefunds error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get Departments List
 * Public API - No authentication required
 * Returns list of active departments
 */
router.post("/getDepartments", upload.none(), async (req, res) => {
  try {
    const { default: Department } = await import("../_models/departments.js");

    const departments = await Department.findAll({
      where: { status: 1 },
      attributes: ['id', 'title', 'description'],
      order: [['title', 'ASC']],
    });

    return res.json({
      status: 1,
      msg: "Departments fetched successfully",
      data: departments,
    });
  } catch (err) {
    console.error("getDepartments error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get Email Templates List
 * Public API - No authentication required
 * Returns list of active email templates
 */
router.post("/getEmailTemplates", upload.none(), async (req, res) => {
  try {
    const { default: EmailTemplate } = await import("../_models/emailTemplates.js");

    const templates = await EmailTemplate.findAll({
      where: { status: 1 },
      attributes: ['id', 'title', 'template_code', 'content'],
      order: [['title', 'ASC']],
    });

    return res.json({
      status: 1,
      msg: "Email templates fetched successfully",
      data: templates,
    });
  } catch (err) {
    console.error("getEmailTemplates error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get FAQs List
 * Public API - No authentication required
 * Returns list of active FAQs
 */
router.post("/getFaqs", upload.none(), async (req, res) => {
  const schema = Joi.object({
    faq_category_id: Joi.string().optional().allow('', null),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  try {
    const { default: Faq } = await import("../_models/faqs.js");

    const whereClause = { status: 1 };
    if (value.faq_category_id) {
      whereClause.faq_category_id = value.faq_category_id;
    }

    const faqs = await Faq.findAll({
      where: whereClause,
      attributes: ['id', 'faq_category_id', 'question', 'answer'],
      order: [['id', 'ASC']],
    });

    return res.json({
      status: 1,
      msg: "FAQs fetched successfully",
      data: faqs,
    });
  } catch (err) {
    console.error("getFaqs error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get FAQ Categories List
 * Public API - No authentication required
 * Returns list of active FAQ categories
 */
router.post("/getFaqCategories", upload.none(), async (req, res) => {
  try {
    const { default: FaqCategory } = await import("../_models/faqCategories.js");

    const categories = await FaqCategory.findAll({
      where: { status: 1 },
      attributes: ['id', 'title'],
      order: [['title', 'ASC']],
    });

    return res.json({
      status: 1,
      msg: "FAQ categories fetched successfully",
      data: categories,
    });
  } catch (err) {
    console.error("getFaqCategories error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get Group Pujas List
 * Public API - No authentication required
 * Returns list of active group pujas
 */
router.post("/getGroupPujas", upload.none(), async (req, res) => {
  const schema = Joi.object({
    group_puja_category_id: Joi.number().optional().allow(null),
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(20),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  try {
    const { default: GroupPujaModel } = await import("../_models/GroupPujaModel.js");

    const whereClause = { status: 1 };
    if (value.group_puja_category_id) {
      whereClause.group_puja_category_id = value.group_puja_category_id;
    }

    const offset = (value.page - 1) * value.limit;
    const hostUrl = `${req.protocol}://${req.get("host")}/`;
    const imagePath = constants?.group_puja_image_path || 'uploads/group_pujas/';

    const { count, rows: pujas } = await GroupPujaModel.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'group_puja_category_id', 'group_puja_name', 'slug', 'group_puja_image', 'group_puja_description', 'meta_title', 'meta_description'],
      order: [['created_at', 'DESC']],
      limit: value.limit,
      offset,
    });

    const transformedPujas = pujas.map(puja => ({
      ...puja.get({ plain: true }),
      group_puja_image: puja.group_puja_image ? `${hostUrl}${imagePath}${puja.group_puja_image}` : ''
    }));

    return res.json({
      status: 1,
      msg: "Group pujas fetched successfully",
      data: transformedPujas,
      total: count,
      page: value.page,
      limit: value.limit,
    });
  } catch (err) {
    console.error("getGroupPujas error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get Group Puja Assignments
 * Public API - No authentication required
 * Returns list of active group puja assignments with astrologer and puja details
 */
router.post("/getGroupPujaAssigns", upload.none(), async (req, res) => {
  const schema = Joi.object({
    group_puja_id: Joi.number().optional().allow(null),
    astrologer_uni_id: Joi.string().optional().allow('', null),
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(20),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  try {
    const { default: GroupPujaAssignModel } = await import("../_models/GroupPujaAssignModel.js");
    const { default: GroupPujaModel } = await import("../_models/GroupPujaModel.js");

    const whereClause = { status: 1 };
    if (value.group_puja_id) {
      whereClause.group_puja_id = value.group_puja_id;
    }
    if (value.astrologer_uni_id) {
      whereClause.astrologer_uni_id = value.astrologer_uni_id;
    }

    const offset = (value.page - 1) * value.limit;
    const hostUrl = `${req.protocol}://${req.get("host")}/`;
    const pujaImagePath = constants?.group_puja_image_path || 'uploads/group_pujas/';
    const astrologerImagePath = constants?.astrologer_image_path || 'uploads/astrologers/';

    const { count, rows: assigns } = await GroupPujaAssignModel.findAndCountAll({
      where: whereClause,
      order: [['group_puja_date', 'ASC'], ['group_puja_time', 'ASC']],
      limit: value.limit,
      offset,
    });

    // Get puja details for each assignment
    const pujaIds = [...new Set(assigns.map(a => a.group_puja_id))];
    const pujas = await GroupPujaModel.findAll({
      where: { id: pujaIds },
      attributes: ['id', 'group_puja_name', 'group_puja_image', 'slug'],
    });
    const pujaMap = {};
    pujas.forEach(p => {
      pujaMap[p.id] = p.get({ plain: true });
    });

    // Get astrologer details
    const astrologerIds = [...new Set(assigns.map(a => a.astrologer_uni_id))];
    const astrologers = await Astrologer.findAll({
      where: { astrologer_uni_id: astrologerIds },
      attributes: ['astrologer_uni_id', 'display_name', 'profile_img'],
    });
    const astrologerMap = {};
    astrologers.forEach(a => {
      astrologerMap[a.astrologer_uni_id] = a.get({ plain: true });
    });

    const transformedAssigns = assigns.map(assign => {
      const puja = pujaMap[assign.group_puja_id] || {};
      const astrologer = astrologerMap[assign.astrologer_uni_id] || {};
      return {
        ...assign.get({ plain: true }),
        group_puja_name: puja.group_puja_name || '',
        group_puja_image: puja.group_puja_image ? `${hostUrl}${pujaImagePath}${puja.group_puja_image}` : '',
        group_puja_slug: puja.slug || '',
        astrologer_name: astrologer.display_name || '',
        astrologer_image: astrologer.profile_img ? `${hostUrl}${astrologerImagePath}${astrologer.profile_img}` : '',
      };
    });

    return res.json({
      status: 1,
      msg: "Group puja assignments fetched successfully",
      data: transformedAssigns,
      total: count,
      page: value.page,
      limit: value.limit,
    });
  } catch (err) {
    console.error("getGroupPujaAssigns error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get Group Puja Categories
 * Public API - No authentication required
 * Returns list of active group puja categories
 */
router.post("/getGroupPujaCategories", upload.none(), async (req, res) => {
  const schema = Joi.object({
    parent_id: Joi.number().optional().allow(null),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  try {
    const { default: GroupPujaCategory } = await import("../_models/groupPujaCategory.js");

    const whereClause = { status: 1 };
    if (value.parent_id !== undefined && value.parent_id !== null) {
      whereClause.parent_id = value.parent_id;
    }

    const hostUrl = `${req.protocol}://${req.get("host")}/`;
    const imagePath = constants?.group_puja_category_image_path || 'uploads/group_puja_category/';

    const categories = await GroupPujaCategory.findAll({
      where: whereClause,
      attributes: ['id', 'parent_id', 'title', 'slug', 'description', 'image', 'meta_title', 'meta_description'],
      order: [['title', 'ASC']],
    });

    const transformedCategories = categories.map(cat => ({
      ...cat.get({ plain: true }),
      image: cat.image ? `${hostUrl}${imagePath}${cat.image}` : ''
    }));

    return res.json({
      status: 1,
      msg: "Group puja categories fetched successfully",
      data: transformedCategories,
    });
  } catch (err) {
    console.error("getGroupPujaCategories error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

/**
 * Get Group Puja Orders (Customer's puja bookings)
 * Requires authentication
 * Returns list of customer's group puja orders
 */
router.post("/getGroupPujaOrders", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(20),
    status: Joi.string().optional().allow('', null),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      msg: error.details.map((d) => d.message).join("\n"),
    });
  }

  const { api_key, user_uni_id, page, limit, status } = value;

  if (!(await checkUserApiKey(api_key, user_uni_id))) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    });
  }

  try {
    const { default: GroupPujaOrder } = await import("../_models/groupPujaOrders.js");
    const { default: GroupPujaAssignModel } = await import("../_models/GroupPujaAssignModel.js");
    const { default: GroupPujaModel } = await import("../_models/GroupPujaModel.js");

    const whereClause = { customer_uni_id: user_uni_id };
    if (status) {
      whereClause.status = status;
    }

    const offset = (page - 1) * limit;
    const hostUrl = `${req.protocol}://${req.get("host")}/`;
    const pujaImagePath = constants?.group_puja_image_path || 'uploads/group_pujas/';
    const astrologerImagePath = constants?.astrologer_image_path || 'uploads/astrologers/';

    const { count, rows: orders } = await GroupPujaOrder.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Get assignment and puja details
    const assignIds = [...new Set(orders.map(o => o.group_puja_assign_id))];
    const assigns = await GroupPujaAssignModel.findAll({
      where: { id: assignIds },
      attributes: ['id', 'group_puja_id'],
    });
    const assignMap = {};
    assigns.forEach(a => {
      assignMap[a.id] = a.get({ plain: true });
    });

    const pujaIds = [...new Set(assigns.map(a => a.group_puja_id))];
    const pujas = await GroupPujaModel.findAll({
      where: { id: pujaIds },
      attributes: ['id', 'group_puja_name', 'group_puja_image', 'slug'],
    });
    const pujaMap = {};
    pujas.forEach(p => {
      pujaMap[p.id] = p.get({ plain: true });
    });

    // Get astrologer details
    const astrologerIds = [...new Set(orders.map(o => o.astrologer_uni_id))];
    const astrologers = await Astrologer.findAll({
      where: { astrologer_uni_id: astrologerIds },
      attributes: ['astrologer_uni_id', 'display_name', 'profile_img'],
    });
    const astrologerMap = {};
    astrologers.forEach(a => {
      astrologerMap[a.astrologer_uni_id] = a.get({ plain: true });
    });

    const transformedOrders = orders.map(order => {
      const assign = assignMap[order.group_puja_assign_id] || {};
      const puja = pujaMap[assign.group_puja_id] || {};
      const astrologer = astrologerMap[order.astrologer_uni_id] || {};
      return {
        ...order.get({ plain: true }),
        group_puja_name: puja.group_puja_name || '',
        group_puja_image: puja.group_puja_image ? `${hostUrl}${pujaImagePath}${puja.group_puja_image}` : '',
        group_puja_slug: puja.slug || '',
        astrologer_name: astrologer.display_name || '',
        astrologer_image: astrologer.profile_img ? `${hostUrl}${astrologerImagePath}${astrologer.profile_img}` : '',
      };
    });

    return res.json({
      status: 1,
      msg: "Group puja orders fetched successfully",
      data: transformedOrders,
      total: count,
      page,
      limit,
    });
  } catch (err) {
    console.error("getGroupPujaOrders error:", err);
    return res.json({
      status: 0,
      msg: "Something went wrong",
      data: [],
      error: err.message,
    });
  }
});

export default router;