import express from "express";
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import db from "../_config/db.js";
import  {Op,Sequelize,literal}  from 'sequelize';
import { checkUserApiKey, getCurrency, getBestDiscountForService, getAstroDiscountedPrice, isFirstUser } from "../_helpers/common.js";
import Follower from "../_models/followers.js";
import AstrologerPrice from "../_models/astrologer_prices.js";
import AstrologerGallery from "../_models/astrologer_galleries.js";
import Reviews from "../_models/reviews.js";
import AstrologerDocument from "../_models/astrologer_documents.js";
import Languages from "../_models/languages.js";
import Skills from "../_models/skills.js";
import Category from "../_models/categories.js";
import Astrologer from "../_models/astrologers.js";
import User from "../_models/users.js";
import CustomerModel from "../_models/customers.js";
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { ROLE_IDS ,constants,configData,imagePath} from '../_config/constants.js';
import AstrologerDiscountAssign from "../_models/astrologer_discount_assigns.js";
import AstrologerSkill from "../_models/astrologerSkills.js";
import CallHistory from "../_models/call_history.js";
import AstrologerLanguage from "../_models/astrologerlanguage.js";
import Blog from "../_models/blog.js";
import {getAstrologerAssets}  from "./astrocommon.js";
import LiveSchedule from "../_models/live_schedules.js";
import {ServiceAssign} from "../_models/serviceAssign.js";
import Service from "../_models/services.js";
import moment from 'moment-timezone';

dotenv.config();
const router = express.Router();
const upload = multer();

router.post('/getFollowing', upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional().allow(null)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      message: 'Validation failed',
      errors: error.details,
      msg: error.details.map(err => err.message).join('\n')
    });
  }

  const { api_key, user_uni_id } = req.body;
  const offset = parseInt(req.body.offset) || 0;
  const limit = 6;

  try {
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

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

    const astrologers = await Follower.findAll({
      limit,
      offset,
      where: {
        user_uni_id: user_uni_id,
        status: 1
      },
      include: [
        {
          model: Astrologer,
          as: 'astrologer',
          attributes: [
            'display_name', 'astro_img', 'experience', 'astrologer_uni_id',
            'is_virtual', 'live_status', 'video_status',
            'online_status', 'call_status', 'chat_status', 'busy_status',
            'livechannel', 'live_expire', 'live_topic', 'livetoken',
            [
              Sequelize.literal(`(
                SELECT IFNULL(SUM(ch.waiting_time), 0)
                FROM call_history AS ch
                WHERE ch.astrologer_uni_id = astrologer.astrologer_uni_id
                  AND ch.status IN ('queue', 'queue_request', 'request', 'in-progress')
              )`),
              "total_waiting_time"
            ],
            [
              literal(`(
                  SELECT IFNULL(SUM(IF(call_type = 'call', IFNULL(duration, 0), 0)), 0)
                  FROM call_history
                  WHERE call_history.astrologer_uni_id = astrologer.astrologer_uni_id
                )`),
                'total_call_duration',
            ], 
            [
                  literal(`(
                    SELECT IFNULL(SUM(IF(call_type = 'chat', IFNULL(duration, 0), 0)), 0)
                    FROM call_history
                    WHERE call_history.astrologer_uni_id = astrologer.astrologer_uni_id
                  )`),
                  'total_chat_duration',
            ],
            [
                  literal(`(
                    SELECT IFNULL(SUM(IF(call_type = 'video', IFNULL(duration, 0), 0)), 0)
                    FROM call_history
                    WHERE call_history.astrologer_uni_id = astrologer.astrologer_uni_id
                  )`),
                  'total_video_duration',
            ],
            [
                  literal(`(
                    SELECT COUNT(*)
                    FROM call_history
                    WHERE call_history.astrologer_uni_id = astrologer.astrologer_uni_id
                    AND call_type = 'call' AND status = 'completed'
                  )`),
                  'total_call_count',
                ],
                [
                  literal(`(
                    SELECT COUNT(*)
                    FROM call_history
                    WHERE call_history.astrologer_uni_id = astrologer.astrologer_uni_id
                    AND call_type = 'chat' AND status = 'completed'
                  )`),
                  'total_chat_count',
                ],
                [
                  literal(`(
                    SELECT COUNT(*)
                    FROM call_history
                    WHERE call_history.astrologer_uni_id = astrologer.astrologer_uni_id
                    AND call_type = 'video' AND status = 'completed'
                  )`),
                  'total_video_count',
              ],
          ],
          include: [
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
            },
            { 
              model: Blog,
              as: 'blogs',
              attributes: ['id', 'title', 'slug', 'content', 'created_at'],
            } 
          ],
        }
      ]
    });

    if (!astrologers || astrologers.length === 0) {
      return res.status(200).json({
        status: 0,
        msg: "No Records Found"
      });
    }

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

    const data = astrologers.map(async (follower) => {
      try {
        const astrologer = follower.astrologer;
        
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
        const astro_img_url = astrologer.astro_img
          ? `${req.protocol}://${req.get("host")}/uploads/astrologer/icon/${astrologer.astro_img}`
          : `${req.protocol}://${req.get("host")}/assets/img/customer.png`;

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
      
    return res.json(result);

  } catch (err) {
    console.error("Error in getFollowing:", err);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong.. Try Again",
    });
  }
});

export default router;
