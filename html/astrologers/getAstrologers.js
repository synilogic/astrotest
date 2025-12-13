import express from "express";
import Joi from "joi";
import  {Op,Sequelize,literal}  from 'sequelize';
import Astrologer from "../_models/astrologers.js";
import User from "../_models/users.js";
import axios from 'axios';
import AstrologerSkill from "../_models/astrologerSkills.js";
import CallHistory from "../_models/call_history.js";
import AstrologerLanguage from "../_models/astrologerlanguage.js";
import Skills from "../_models/skills.js";
import Blog from "../_models/blog.js";
import {getAstrologerAssets}  from "./astrocommon.js";
import Languages from "../_models/languages.js";
import AstrologerPrice from "../_models/astrologer_prices.js";
import Category from "../_models/categories.js";
import LiveSchedule from "../_models/live_schedules.js";
import {ServiceAssign} from "../_models/serviceAssign.js";
import Service from "../_models/services.js";
import fs from 'fs';
import { ROLE_IDS ,constants,configData,imagePath} from '../_config/constants.js';
import {applySearchFilter,applyAstrologerFilters,applyAstrologerSortQuery,
  applyAstrologerSequenceOrder, getBestDiscountForService, getAstroDiscountedPrice, isFirstUser, getCurrency} from '../_helpers/common.js';
import path from 'path';
import dayjs from "dayjs";
import multer from "multer";
import moment from 'moment-timezone';
import AstrologerDiscountAssign from "../_models/astrologer_discount_assigns.js";
import crypto from 'crypto';
import { getFromCache, setToCache, CACHE_TTL } from '../_helpers/cacheHelper.js';

const upload =multer();
const router = express.Router();



router.post("/getAllAstrologer", upload.none(), async (req, res) => {
  try {
       
      
    let astrologers = [];
   // console.log("req body",req.body);
    const body = req.body || {};
     console.log("body data",body);
    const isFirst =body.isFirst || 0;
    const offset = parseInt(body.offset) || 0;
    const limit = parseInt(body.limit) || 6;
    const search = body.search;
    const category = body.category;
    const user_uni_id = body.user_uni_id;
    
    // Get user's currency preference
    let userCurrency = 'INR'; // Default currency
    if (user_uni_id) {
      try {
        const currencyDetail = await getCurrency(user_uni_id, "all");
        userCurrency = currencyDetail.currency_code;
      } catch (currencyError) {
        console.log("Error getting user currency, using default:", currencyError.message);
        // Continue with default currency
      }
    }
    
    const whereClause = {
      astrologer_uni_id: { [Op.like]: 'ASTRO%' },
      //process_status: 4,
     };

    
        const includeArray = [];
        const orderArray = [];
   //getAstroDataForCustomer(user_uni_id);
   applyAstrologerSequenceOrder(orderArray);
   applyAstrologerFilters(req.body, whereClause, includeArray);
   applyAstrologerSortQuery(req.body, orderArray, includeArray,whereClause);
   applySearchFilter(whereClause, includeArray, search);
    if (
      body.is_virtual === '1' ||
      body.is_virtual === 1 ||
      body.is_virtual === true
    ) {
      whereClause.is_virtual = true;
    } else {    
      whereClause.is_virtual = false;
    }

   // Generate comprehensive cache key after all filters are applied
   // Cache strategy: Cache all requests except when search is provided (search results are dynamic)
   // For search queries, use shorter TTL since results may change frequently
   let cachedResult = null;
   const shouldCache = true; // Cache all requests
   const isSearchQuery = !!search && search.trim().length > 0;
   
   if (shouldCache) {
     // Create comprehensive cache key including all filters
     const cacheKeyParams = {
       offset: Number(offset),
       limit: Number(limit),
       search: search || '',
       category: category || '',
       is_virtual: body.is_virtual || false,
       user_currency: userCurrency,
       // Include filter hash for whereClause and orderArray
       whereClause_hash: crypto.createHash('md5').update(JSON.stringify(whereClause)).digest('hex').substring(0, 8),
       orderArray_hash: crypto.createHash('md5').update(JSON.stringify(orderArray)).digest('hex').substring(0, 8)
     };
     
     // Create hash of cache key for shorter key
     const cacheKeyHash = crypto.createHash('md5').update(JSON.stringify(cacheKeyParams)).digest('hex');
     const cacheKey = {
       hash: cacheKeyHash,
       offset: Number(offset),
       limit: Number(limit),
       search: search || '',
       is_search: isSearchQuery
     };
     
     console.log(`[Cache] Checking cache for astrologers - Key: ${cacheKeyHash.substring(0, 12)}...`);
     cachedResult = await getFromCache('astrologers', cacheKey);
     
     if (cachedResult) {
       console.log(`[Cache] ✅ Cache HIT for astrologers - Key: ${cacheKeyHash.substring(0, 12)}...`);
       return res.json(cachedResult);
     }
     console.log(`[Cache] ❌ Cache MISS for astrologers - Key: ${cacheKeyHash.substring(0, 12)}...`);
   }
   
   astrologers = await Astrologer.findAll({
    limit,
    offset,
    where: whereClause,
    order: orderArray,
   attributes: [
    'display_name', 'astro_img', 'experience', 'astrologer_uni_id',
    'is_virtual', 'live_status', 'video_status',
    'online_status', 'call_status', 'chat_status', 'busy_status',
    'livechannel', 'live_expire', 'live_topic', 'livetoken',
   [
  Sequelize.literal(`(
    SELECT IFNULL(SUM(ch.waiting_time), 0)
    FROM call_history AS ch
    WHERE ch.astrologer_uni_id = astrologers.astrologer_uni_id
      AND ch.status IN ('queue', 'queue_request', 'request', 'in-progress')
  )`),
  "total_waiting_time"
  ],
   [
        literal(`(
            SELECT IFNULL(SUM(IF(call_type = 'call', IFNULL(duration, 0), 0)), 0)
            FROM call_history
            WHERE call_history.astrologer_uni_id = astrologers.astrologer_uni_id
          )`),
          'total_call_duration',
   ], 
    [
          literal(`(
            SELECT IFNULL(SUM(IF(call_type = 'chat', IFNULL(duration, 0), 0)), 0)
            FROM call_history
            WHERE call_history.astrologer_uni_id = astrologers.astrologer_uni_id
          )`),
          'total_chat_duration',
   ],
    [
          literal(`(
            SELECT IFNULL(SUM(IF(call_type = 'video', IFNULL(duration, 0), 0)), 0)
            FROM call_history
            WHERE call_history.astrologer_uni_id = astrologers.astrologer_uni_id
          )`),
          'total_video_duration',
    ],
     [
          literal(`(
            SELECT COUNT(*)
            FROM call_history
            WHERE call_history.astrologer_uni_id = astrologers.astrologer_uni_id
            AND call_type = 'call' AND status = 'completed'
          )`),
          'total_call_count',
        ],
        [
          literal(`(
            SELECT COUNT(*)
            FROM call_history
            WHERE call_history.astrologer_uni_id = astrologers.astrologer_uni_id
            AND call_type = 'chat' AND status = 'completed'
          )`),
          'total_chat_count',
        ],
        [
          literal(`(
            SELECT COUNT(*)
            FROM call_history
            WHERE call_history.astrologer_uni_id = astrologers.astrologer_uni_id
            AND call_type = 'video' AND status = 'completed'
          )`),
          'total_video_count',
      ],

  ],
  include: [
   
    ...includeArray,
    {
      model: CallHistory,
      as: "call_history",
      attributes: [],
      required: false,
      where: {
        status: {
          [Op.in]: ['queue', 'queue_request', 'request', 'in-progress']
        }
      }
    },
    {
      model: User,
      as: 'user',
      attributes: ['avg_rating', 'user_uni_id', 'name', 'user_fcm_token', 'id'],
      where: { role_id: ROLE_IDS.ASTROLOGER, trash:0,status:1},
      required: true
    },
    {
      model: Skills,
      as: 'all_skills',
      attributes: ['id','skill_name'],
      through: { attributes: [] },
    },
    {
      model: Languages,
      as: 'all_languages',
      attributes: ['language_name'],
      through: { attributes: [] },
    },
    {
      model: Category,
      as: 'all_categories',
      attributes: ['id','category_title'],
      through: { attributes: [] },
    },
    {
      model: AstrologerPrice,
      as: 'prices',
      attributes: ['id', 'actual_price', 'type', 'currency', 'price', 'time_in_minutes', 'updated_at', 'created_at', 'trash'],
      where: {
        trash: 0,
        currency: userCurrency,
        type: {
          [Op.in]: ['call', 'chat', 'video', 'callwithlive', 'videocallwithlive', 'privatecallwithlive', 'privatevideocallwithlive']
        }
      },
      required: false
    },
     {
      model: ServiceAssign,
      as: 'service_assigns',
      attributes: ['id', 'service_id', 'price', 'actual_price', 'description', 'duration', 'status'],
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'service_name']
        }
      ]
    }
    ,
      { 
        model: Blog,
        as: 'blogs',
        attributes: ['id', 'title', 'slug', 'content', 'created_at'],// Adjust fields
      } 
  ],
//   group: [
//   'astrologers.id',
//   'users.id',

// ]

   });
      

  // console.log("astrologers",astrologers);
    if (!astrologers || astrologers.length === 0) {
      return res.json({
        status: 0,
        msg: "No Record Found"
      });
    }

    // If isFirst and user_id provided, pre-process astrologers using asset function
    if (isFirst && user_uni_id) {
     // console.log("hii i am here for isFirst");
      for (let i = 0; i < astrologers.length; i++) {
        astrologers[i] = await getAstrologerAssets(astrologers[i], req.body);
      }
    }

   // console.log("hiii get astro data",astrologers);

    // Transform prices with discounted pricing function
    const transformPricesWithDiscounts = async (prices, user_uni_id, astrologer_uni_id) => {
      try {
        // Check if user is first-time user
        const isFirstTimeUser = user_uni_id ? await isFirstUser(user_uni_id, astrologer_uni_id) : false;
        
        // Get active discounts for this astrologer
        const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
        const activeDiscounts = await AstrologerDiscountAssign.findAll({
          where: {
            astrologer_uni_id: astrologer_uni_id,
            start_from: { [Op.lte]: now },
            end_at: { [Op.gte]: now },
            status: 1,
          }
        });
        
        return prices?.map(price => {
          const originalPrice = parseFloat(price.price) || 0;
          const originalActualPrice = parseFloat(price.actual_price) || 0;
          
          // Determine price type for discount lookup
          let priceType = '';
          if (price.type === 'call' || price.type === 'internal_call' || price.type === 'callwithlive' || price.type === 'privatecallwithlive') {
            priceType = 'call';
          } else if (price.type === 'chat') {
            priceType = 'chat';
          } else if (price.type === 'video' || price.type === 'videocall' || price.type === 'videocallwithlive' || price.type === 'privatevideocallwithlive') {
            priceType = 'video';
          }
          
          // Get the best discount for this price type
          const discount = getBestDiscountForService(activeDiscounts, priceType);
          
          let discountedPrice = originalPrice;
          let discountedActualPrice = originalActualPrice;
          let discountInfo = null;
          let actual_price= 0;
          
          if (discount && discount.discount_percent > 0) {
            discountedPrice = getAstroDiscountedPrice(
              astrologer_uni_id,
              originalPrice,
              discount.discount_percent
            );
            discountedActualPrice = getAstroDiscountedPrice(
              astrologer_uni_id,
              originalActualPrice,
              discount.discount_percent
            );
            
            discountInfo = {
              discount_percent: discount.discount_percent,
              discount_title: discount.title,
              discount_duration: discount.duration,
              start_from: discount.start_from,
              end_at: discount.end_at,
              is_discounted: true
            };
            actual_price = originalPrice;
          } 
      
          // Set first_call_free_minutes based on first-time user status
          let firstCallFreeMinutes = "";
          if (price.type === 'call' || price.type === 'chat' || price.type === 'video') {
            if (!isFirstTimeUser) {
              firstCallFreeMinutes = "3";
            }
          }
      
          return {
            id: price.id,
            astrologer_uni_id: price.astrologer_uni_id,
            type: price.type,
            price: discountedPrice,
            actual_price: actual_price,
            // discounted_price: discountedPrice,
            // discounted_actual_price: discountedActualPrice,
            time_in_minutes: price.time_in_minutes,
            currency: price.currency,
            trash: price.trash,
            created_at: price.created_at,
            updated_at: price.updated_at,
            first_call_free_minutes: firstCallFreeMinutes,
            next_online_time: price.next_online_time || "",
          };
        }) || [];
      } catch (error) {
        console.error("Error in transformPricesWithDiscounts:", error);
        return prices || [];
      }
    };

    const data = astrologers.map(async (astrologer) => {
      try {
        const skill_names = astrologer.all_skills?.map(s => s.skill_name).join(', ') || '';
        const language_name = astrologer.all_languages?.map(l => l.language_name).join(', ') || '';
        const category_names = astrologer.all_categories?.map(c => c.category_title).join(', ') || '';

        const total_call_count = parseInt(astrologer.get('total_call_count')) || 0;
        const total_chat_count = parseInt(astrologer.get('total_chat_count')) || 0;
        const total_video_count = parseInt(astrologer.get('total_video_count')) || 0;
        const total_orders_count = (total_call_count + total_chat_count + total_video_count).toString();

        // Transform prices with discounted pricing
        const transformedPrices = await transformPricesWithDiscounts(astrologer.prices, user_uni_id, astrologer.astrologer_uni_id);
        const formattedprices = transformedPrices.map(price=>({
                    ...price,
                    created_at: dayjs(price.created_at).format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: dayjs(price.updated_at).format("YYYY-MM-DD HH:mm:ss"),
                  })); 
        // Construct image URL using constants for consistency
        const hostUrl = `${req.protocol}://${req.get("host")}`;
        const astro_img_url = astrologer.astro_img
          ? `${hostUrl}/${constants.astrologer_image_path}icon/${astrologer.astro_img}`
          : `${hostUrl}/${constants.default_astrologer_image_path}`;

        // Debug logging for image URLs - REMOVED to prevent memory issues
        // Only log in development mode if needed
        // if (process.env.NODE_ENV === 'development') {
        //   console.log(`[Image URL] Astrologer ${astrologer.astrologer_uni_id}:`, {
        //     display_name: astrologer.display_name,
        //     astro_img_from_db: astrologer.astro_img,
        //     constructed_url: astro_img_url,
        //     protocol: req.protocol,
        //     host: req.get("host")
        //   });
        // }

        const user = astrologer.user || {};
      
        return {
          display_name: astrologer.display_name,
          is_virtual: astrologer.is_virtual,
          live_status: astrologer.live_status,
          video_status: astrologer.video_status,
          call_status: astrologer.call_status,
          online_status: astrologer.online_status,
          livechannel: astrologer.livechannel,
          livetoken: astrologer.livetoken,
          live_topic: astrologer.live_topic,
          live_expire: dayjs(astrologer.live_expire).isValid() ? dayjs(astrologer.live_expire).format("YYYY-MM-DD HH:mm:ss") : null,
          chat_status: astrologer.chat_status,
          busy_status: astrologer.busy_status,
          total_orders_count: total_orders_count,
          astro_img: astro_img_url,
          experience: astrologer.experience,
          avg_rating: user.avg_rating || 0,
          total_waiting_time: parseInt(astrologer.get('total_waiting_time')) || 0,
          astrologer_uni_id: astrologer.astrologer_uni_id,
          skill_names,
          language_name,
          category_names,
          user: {
            id: user.id,
            avg_rating: user.avg_rating,
            user_uni_id: user.user_uni_id,
            name: user.name,
            user_fcm_token: user.user_fcm_token,
          },
          prices: formattedprices
        };
      } catch (error) {
        console.error("Error processing astrologer:",  error);
        return null;
      }
    });

    // Wait for all async operations to complete
    const finalData = await Promise.all(data);
    
    // Filter out any null results from errors
    const validData = finalData.filter(item => item !== null);

    const result = validData.length > 0
      ? {
          status: 1,
          msg: "Result Found",
          offset: offset + limit,
          data: validData
        }
      : {
          status: 0,
          msg: "No Record Found"
        };
    
    // Cache the result with appropriate TTL based on query type
    if (shouldCache && cachedResult === null && result.status === 1) {
      // Recreate cache key (must match the one used for getFromCache)
      const cacheKeyParams = {
        offset: Number(offset),
        limit: Number(limit),
        search: search || '',
        category: category || '',
        is_virtual: body.is_virtual || false,
        user_currency: userCurrency,
        whereClause_hash: crypto.createHash('md5').update(JSON.stringify(whereClause)).digest('hex').substring(0, 8),
        orderArray_hash: crypto.createHash('md5').update(JSON.stringify(orderArray)).digest('hex').substring(0, 8)
      };
      const cacheKeyHash = crypto.createHash('md5').update(JSON.stringify(cacheKeyParams)).digest('hex');
      const cacheKey = {
        hash: cacheKeyHash,
        offset: Number(offset),
        limit: Number(limit),
        search: search || '',
        is_search: isSearchQuery
      };
      
      // Use shorter TTL for search queries (1 minute) vs regular queries (5 minutes)
      const ttl = isSearchQuery ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM;
      
      console.log(`[Cache] Attempting to cache astrologers - Key: ${cacheKeyHash.substring(0, 12)}..., TTL: ${ttl}s, Status: ${result.status}`);
      
      const cacheSuccess = await setToCache('astrologers', cacheKey, result, ttl);
      if (cacheSuccess) {
        console.log(`[Cache] ✅ Successfully cached astrologers result - Key: ${cacheKeyHash.substring(0, 12)}..., TTL: ${ttl}s`);
      } else {
        console.log(`[Cache] ⚠️ Failed to cache astrologers result - Key: ${cacheKeyHash.substring(0, 12)}... (Redis may not be available)`);
      }
    } else {
      if (!shouldCache) {
        console.log(`[Cache] ⚠️ Caching disabled for this request`);
      } else if (cachedResult !== null) {
        console.log(`[Cache] ⚠️ Not caching - result was already from cache`);
      } else if (result.status !== 1) {
        console.log(`[Cache] ⚠️ Not caching - result status is ${result.status} (only caching successful results)`);
      }
    }
      
    return res.json(result);

  } catch (error) {
    console.error("Error fetching astrologer summary:", error);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      error: error.message
    });
  }
});

router.post("/getLiveAstrologer", async (req, res) => {
  // 1. Validate input
  const schema = Joi.object({
    id: Joi.any().optional(),
    user_api_key: Joi.any().optional(),
    gender: Joi.any().optional(),
    skill: Joi.any().optional(),
    language: Joi.any().optional(),
    categoy: Joi.any().optional(),
    user_ios_token: Joi.any().optional(),
    user_fcm_token: Joi.any().optional(),
  });

  const { error, value: attributes } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMsg = error.details.map(d => d.message).join('\n');
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: errorMsg
    });
  }

  try {
    // 2. Build dynamic filters
    const skillCondition = attributes.skill
      ? { skill_id: { [Op.like]: `%${attributes.skill}%` } }
      : {};
    const languageCondition = attributes.language
      ? { language_id: attributes.language }
      : {};

    // 3. Query database using Sequelize
    const liveAstrologers = await User.findAll({
      include: [
        {
          model: Astrologer,
          as: 'astrologer',
          required: true,
          include: [
            {
              model: AstrologerSkill,
              as: 'skills',
              required: !!attributes.skill,
              where: skillCondition
            },
            {
              model: AstrologerLanguage,
              as: 'languages',
              required: !!attributes.language,
              where: languageCondition
            }
          ]
        }
      ]
    });

    // 4. Build response
    if (liveAstrologers.length > 0) {
      return res.json({
        stuts: 1,
        count: liveAstrologers.length,
        data: liveAstrologers,
        msg: 'success'
      });
    } else {
      return res.json({
        stuts: 0,
        msg: 'empty'
      });
    }
  } catch (err) {
    console.error('getLiveAstrologer error:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Internal Server Error',
      error: err.message
    });
  }
});


router.post("/upcomingLiveAstrologer", async (req, res) => {
  // 1. Validate input
  const schema = Joi.object({
    offset: Joi.number().integer().min(0).optional(),
  });
 const { error, value } = schema.validate(req.body);

  if (error) {
    const message = error.details.map((d) => d.message).join('\n');
    const result = {
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: message,
    };
    // await updateApiLogs(apiLog, result); // This line was not in the original file, so it's removed.
    return res.status(400).json(result);
  }

  const offset = value.offset || 0;
  const pageLimit = constants.api_page_limit || 10; // Assuming constants is defined elsewhere or needs to be imported

  try {
    const records = await LiveSchedule.findAll({
      where: {
        status: '1',
        schedule_type: 'live',
        [Op.and]: [
          literal(`CONCAT(date, ' ', time) > '${constants.current_datetime}'`)
        ],
      },
      include: [
        {
          model: Astrologer,
          as: 'astrologer',
          attributes: ['id', 'astrologer_uni_id', 'display_name', 'slug', 'astro_img'],
        }
      ],
      offset: offset,
      limit: pageLimit,
      order: [['date', 'ASC'], ['time', 'ASC']],
    });

    let result;
    if (records.length > 0) {
      result = {
        status: 1,
        msg: 'Upcoming Live Astrologer List',
        offset: offset + pageLimit,
        data: records,
      };
    } else {
      result = {
        status: 0,
        msg: 'No Record Found',
      };
    }

    // await updateApiLogs(apiLog, result); // This line was not in the original file, so it's removed.
    return res.json(result);
  } catch (err) {
    console.error("Error fetching upcoming live astrologers:", err);
    const result = {
      status: 0,
      msg: 'Internal Server Error',
      error: err.message,
    };
    // await updateApiLogs(apiLog, result); // This line was not in the original file, so it's removed.
    return res.status(500).json(result);
  }
});
  
router.post("/featuredCategoryList", async (req, res) => {
  try {
    const { search } = req.body || {};

    const apiPageLimit = constants.api_page_limit;
    const architectCategoryId = configData.architect_category_id;
    const electroHomoeopathyCategoryId = configData.electro_homoeopathy_category_id;

     // 1. Fetch astrologers from internal API
    const astroRes = await axios.post(
      "http://145.223.23.142:8002/api/getAllAstrologer",  // Update URL if hosted elsewhere
      req.body,
      {
       headers: {
      'Content-Type': 'application/json',
    }
  }
    );

   // console.log("astroRes",astroRes);
    const astrologerList = astroRes.data?.data || [];
         // Removed excessive logging to prevent memory issues
         // console.log("astrologerdata",astrologerList);
    // 2. Fetch featured categories
    const categoryWhere = {
      status: 1,
      featured_status: 1,
      id: {
        [Op.notIn]: [architectCategoryId, electroHomoeopathyCategoryId],
      },
    };
           // Removed excessive logging to prevent memory issues
           // console.log("categoryWhere",categoryWhere);
    if (search && search.trim() !== "") {
      categoryWhere.category_title = { [Op.like]: `%${search.trim()}%` };
    }

    const categories = await Category.findAll({ where: categoryWhere, raw: true });
       // Removed excessive logging to prevent memory issues
       // console.log("categories",categories);
    // 3. Match astrologers to categories
    const finalData = categories.map((category) => {
      const astrologer_list = astrologerList.filter((astro) => {
        const categoryNames = (astro.category_names || "").toLowerCase();
        return categoryNames.includes(category.category_title.toLowerCase());
      });

        // console.log("finalData",finalData);
      return {
        ...category,
        category_images: `http://145.223.23.142:8002/${imagePath.CATEGORY_IMAGE_PATH}${category.category_images}`,
           created_at: dayjs(category.created_at).format("YYYY-MM-DD HH:mm:ss"),
           updated_at: dayjs(category.updated_at).format("YYYY-MM-DD HH:mm:ss"),
        astrologer_list,
      };
    });
      // Removed excessive logging to prevent memory issues
      // console.log("finalData" ,finalData);
    // Filter only categories that have astrologers
    const nonEmptyCategories = finalData.filter(
      (item) => item.astrologer_list.length > 0
    );

    if (nonEmptyCategories.length > 0) {
      return res.json({
        status: 1,
        data: nonEmptyCategories,
        msg: "All featured categories with astrologers",
      });
    }

    return res.json({
      status: 0,
      msg: "No data found",
    });

  } catch (err) {
    console.error("featuredCategoryList error:", err);
    return res.status(500).json({
      status: 0,
      msg: "Server error",
      error: err.message,
    });
  }
});



export default router; 
