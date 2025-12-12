import express from "express";
import multer from 'multer';
import Joi from "joi";
import { Op, Sequelize } from "sequelize";
import AstrologerPrice from "../_models/astrologer_prices.js";
import AstrologerGallery from "../_models/astrologer_galleries.js"
import Reviews from "../_models/reviews.js";
import AstrologerDocument from "../_models/astrologer_documents.js";
import Languages from "../_models/languages.js"
import Skills from "../_models/skills.js";
import Category from "../_models/categories.js";
import Astrologer from "../_models/astrologers.js";
import UserModel from "../_models/users.js";
import CustomerModel from "../_models/customers.js";
import AstrologerSkill from "../_models/astrologerSkills.js";
import AstrologerLanguage from "../_models/astrologerlanguage.js";
import { constants } from "../_config/constants.js";
import Follower from "../_models/followers.js";
import { getCurrency, getAstroDiscount, getAstroDiscountedPrice, isFirstUser, getBestDiscountForService } from "../_helpers/common.js";  // Add discount imports
import moment from 'moment-timezone'; // Add moment for date comparison
import AstrologerDiscountAssign from "../_models/astrologer_discount_assigns.js"; // Added missing import
import CallHistory from "../_models/call_history.js";
import numberShorten from "../_helpers/numberShorten.js";
import AstrologerSchedule from "../_models/live_schedules.js";


const router = express.Router();
const upload = multer();

router.post("/getAstrologerDetail", upload.none(), async (req, res) => {
  try {
    const schema = Joi.object({
      astrologer_uni_id: Joi.any().optional().allow(null),
      user_uni_id: Joi.any().optional().allow(null),
      slug: Joi.any().optional().allow(null),
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: 0,
        message: "Validation failed",
        errors: error.details,
        msg: error.details.map(e => e.message).join('\n')
      });
    }

    const { astrologer_uni_id, user_uni_id, slug } = req.body;

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

    const astrologer = await Astrologer.findOne({
      where: { astrologer_uni_id: astrologer_uni_id },
      include: [
         {
          model: Follower,
          as: 'followers',
        },
        {
          model: AstrologerPrice,
          as: 'prices',
          where: { currency: userCurrency }, // Filter prices by user's currency
          required: false, // Make it optional so astrologer is still returned even if no prices for this currency
        },
         {
          model: AstrologerSchedule,
          as: "liveschedule",
           where: { status: 1 },
            required: false
        },
        {
          model: AstrologerGallery,
          as: 'gallery_images'
        },
        {
          model: Reviews,
          as: 'reviews',
          include: [
            {
              model: CustomerModel,
              as: 'customer',
              attributes: ['id', 'customer_uni_id', 'customer_img', 'is_anonymous_review'],
              include: [
                {
                  model: UserModel,
                  as: 'user',
                  attributes: ['id', 'user_uni_id', 'name', 'avg_rating']
                }
              ]
            }
          ],
          limit: 6,
          order: [['created_at', 'DESC']]
        },
        {
          model: AstrologerDocument,
          as: 'document_images'
        },
        {
          model: Languages,
          as: 'languages',
          attributes: ['language_name'],
          through: { attributes: [] },
        },
        {
          model: Skills,
          as: 'skills',
          attributes: ['skill_name'],
          through: { attributes: [] },
        },
        {
          model: Category,
          as: 'categories',
          attributes: ['category_title'],
          through: { attributes: [] },
        },
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'user_uni_id', 'name', 'user_fcm_token', 'user_ios_token', 'avg_rating', 'country_code']
        }
      ],
    });

    if (!astrologer) {
      return res.status(404).json({
        status: 0,
        msg: "Astrologer not found"
      });
    }

    const astrologerReviewCount = await Astrologer.count({
         where: { astrologer_uni_id: astrologer_uni_id },
         include: {
          model: Reviews,
          as: 'reviews',
        },        
    });

      


    let is_follow = false;

    if (user_uni_id && astrologer) {
      const follow = await Follower.findOne({
        where: {
          user_uni_id: user_uni_id,
          astrologer_uni_id: astrologer.astrologer_uni_id,
          status: 1
        }
      });
      if (follow) {
        is_follow = true;
      }
    }

    const totalFollower = await Follower.count({
      where: {
        astrologer_uni_id: astrologer.astrologer_uni_id,
        status: 1
      }
    });

    const callCount = await CallHistory.findOne({
    attributes: [
      [Sequelize.literal(`IFNULL(SUM(IF(call_type = 'call', IFNULL(duration, 0), 0)), 0)`), 'total_call_duration'],
      [Sequelize.literal(`IFNULL(SUM(IF(call_type = 'chat', IFNULL(duration, 0), 0)), 0)`), 'total_chat_duration'],
    ],
    where: {
      astrologer_uni_id: astrologer.astrologer_uni_id,
    },
    raw: true,
  });

    const hostUrl = `${req.protocol}://${req.get("host")}/`;

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

    // Create a map of discount types for easy lookup
    const discountMap = {};
    activeDiscounts.forEach(discount => {
      if (discount.call_status === 1) discountMap['call'] = discount;
      if (discount.chat_status === 1) discountMap['chat'] = discount;
      if (discount.video_status === 1) discountMap['video'] = discount;
    });

   

    // Transform prices with discounted pricing
   const transformPricesWithDiscounts = async (prices, user_uni_id, astrologer_uni_id) => {
        // Check if user is first-time user
        const isFirstTimeUser = user_uni_id ? await isFirstUser(user_uni_id, astrologer_uni_id) : false;
        
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

           let nextOnlineTime = null;
    if (Array.isArray(astrologer.liveschedule)) {
      const filteredLiveSchedules = astrologer.liveschedule.filter(schedule => {
        // Map price types to schedule types
        if (price.type === 'call' || price.type === 'callwithlive' || price.type === 'privatecallwithlive') {
          return schedule.schedule_type === 'call';
        } else if (price.type === 'chat') {
          return schedule.schedule_type === 'chat';
        } else if (price.type === 'video' || price.type === 'videocallwithlive' || price.type === 'privatevideocallwithlive') {
          return schedule.schedule_type === 'video';
        }
        return false; // Default case
      });

      // Get the next online time from filtered schedules
      if (filteredLiveSchedules.length > 0) {
        // Sort by date and time to get the next upcoming schedule
        const sortedSchedules = filteredLiveSchedules.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateA - dateB;
        });

        // Get the next schedule (first one after current time)
        const now = new Date();
        const nextSchedule = sortedSchedules.find(schedule => {
          const scheduleDateTime = new Date(`${schedule.date} ${schedule.time}`);
          return scheduleDateTime > now;
        });

        if (nextSchedule) {
          // Format the next online time
          nextOnlineTime = `${nextSchedule.date} ${nextSchedule.time}`;
        } else {
          // If no future schedule found, use the first one (next day)
          nextOnlineTime = `${sortedSchedules[0].date} ${sortedSchedules[0].time}`;
        }
      }
    }
          
      
         
          // Get the best discount for this price type
          const discount = getBestDiscountForService(activeDiscounts, priceType);

        
          
          // let discountedPrice = originalPrice;
          let discountedPrice = originalPrice;
          let discountedActualPrice = originalActualPrice;
          let discountInfo = null;

        

          
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
            price: discountedPrice, // Original price
            actual_price: discountedPrice, // Original actual price
            // discounted_price: discountedPrice, // Discounted price
            // discounted_actual_price: discountedActualPrice, // Discounted actual price
            time_in_minutes: price.time_in_minutes,
            currency: price.currency,
            trash: price.trash,
            created_at: price.created_at,
            updated_at: price.updated_at,
            first_call_free_minutes: firstCallFreeMinutes, // Updated logic
            next_online_time: nextOnlineTime || "",
            discount: discountInfo // Include discount information
          };
        }) || [];
   };
  

     const allReviews = await Reviews.findAll();

      const reviewsCounting = {
      one_star_count: 0,
      two_star_count: 0,
      three_star_count: 0,
      four_star_count: 0,
      five_star_count: 0,
    };

    allReviews.forEach((r) => {
      switch (r.review_rating) {
        case 1:
          reviewsCounting.one_star_count++;
          break;
        case 2:
          reviewsCounting.two_star_count++;
          break;
        case 3:
          reviewsCounting.three_star_count++;
          break;
        case 4:
          reviewsCounting.four_star_count++;
          break;
        case 5:
          reviewsCounting.five_star_count++;
          break;
        default:
          break;
      }
    });

   
    const transformedData = {
      id: astrologer.id,
      slug: astrologer.slug,
      user_id: astrologer.user_id || 0,
      astrologer_uni_id: astrologer.astrologer_uni_id,
      display_name: astrologer.display_name,
      birth_date: astrologer.birth_date,
      gender: astrologer.gender,
      city: astrologer.city,
      state: astrologer.state,
      country: astrologer.country,
      experience: astrologer.experience,
      astro_img: astrologer.astro_img ? `${hostUrl}${constants.astrologer_image_path}icon/${astrologer.astro_img}` : null,
      astro_img_secondary: `${hostUrl}${constants.default_astrologer_image_path}`,
      live_status: astrologer.live_status,
      video_status: astrologer.video_status,
      online_status: astrologer.online_status,
      call_status: astrologer.call_status,
      chat_status: astrologer.chat_status,
      busy_status: astrologer.busy_status,
      livetoken: astrologer.livetoken,
      livechannel: astrologer.livechannel,
      live_expire: astrologer.live_expire,
      live_topic: astrologer.live_topic,
      long_biography: astrologer.long_biography,
      tag: astrologer.tag,
      is_verified: astrologer.is_verified,
      is_virtual: astrologer.is_virtual,
      ai_astrologer_category: astrologer.ai_astrologer_category || "",
      user_category_id: astrologer.user_category_id || 0,
      degrees: astrologer.degrees || "",
      specialization: astrologer.specialization || "",
      other_app_profile_link: astrologer.other_app_profile_link || "",
      aadhaar_card_no: astrologer.aadhaar_card_no || "",
      ask_question_price: astrologer.ask_question_price || "0.00",
      sort_by: astrologer.sort_by,
      total_call_duration: numberShorten(callCount.total_call_duration / 60, 0) || "0",
      total_chat_duration: numberShorten(callCount.total_chat_duration / 60, 0) || "0",
      total_video_duration: astrologer.total_video_duration || "0",
      review_count: astrologerReviewCount || 0,
      total_waiting_time: astrologer.total_waiting_time || 0,
      total_queue_count: astrologer.total_queue_count || 0,
      is_follow: is_follow,
      follower_count: totalFollower || 0,
      user_api_key: astrologer.user_api_key,
      is_slot_available: astrologer.is_slot_available || 0,
      total_call: astrologer.total_call || "0",
      total_orders_count: astrologer.total_orders_count || "0",
      follower_count_new: String(astrologer.follower_count || 0),
      
      // Transform arrays to comma-separated strings
      category_names: astrologer.categories?.map(c => c.category_title).join(', ') || "",
      skill_names: astrologer.skills?.map(s => s.skill_name).join(', ') || "",
      language_name: astrologer.languages?.map(l => l.language_name).join(', ') || "",
      reviewsCounting,
    
      
      // Transform reviews with customer info and nested user info
      reviews: astrologer.reviews?.map(review => ({
        id: review.id,
        review_by_id: review.review_by_id,
        review_for_id: review.review_for_id,
        review_rating: review.review_rating,
        review_comment: review.review_comment,
        review_type: review.review_type,
        uniqeid: review.uniqeid,
        status: review.status,
        created_at: review.created_at,
        updated_at: review.updated_at,
        customer: review.customer ? {
          id: review.customer.id,
          customer_uni_id: review.customer.customer_uni_id,
          customer_img: review.customer.customer_img || `${hostUrl}${constants.default_customer_image_path}`,
          is_anonymous_review: review.customer.is_anonymous_review
        } : null,
        review_by_user: review.customer?.user ? {
          id: review.customer.user.id,
          user_uni_id: review.customer.user.user_uni_id,
          name: review.customer.user.name,
          avg_rating: review.customer.user.avg_rating || "0.0",
          full_info: `${review.customer.user.name} () {} [${review.customer.user.user_uni_id}] [InActive]`
        } : null
      })) || [],
      
      is_architect: astrologer.is_architect || 0,
      is_electro_homoeopathy: astrologer.is_electro_homoeopathy || 0,
      upcoming_live_time: astrologer.upcoming_live_time || [],
      
      // Transform document images
      document_image_list: astrologer.document_images?.reduce((acc, doc) => {
        if (doc.document_type === 'Aadhaar Card') {
          acc.aadhaar_card_front = `${hostUrl}${constants.astrologer_doc_image_path}${doc.front}`;
          acc.aadhaar_card_back = `${hostUrl}${constants.astrologer_doc_image_path}${doc.back}`;
        } else if (doc.document_type === 'Pan Card') {
          acc.pan_card_front = `${hostUrl}${constants.astrologer_doc_image_path}${doc.front}`;
          acc.pan_card_back = `${hostUrl}${constants.astrologer_doc_image_path}${doc.back}`;
        }
        return acc;
      }, {}) || {},
      
      location: `${astrologer.city}, ${astrologer.state}, ${astrologer.country}`,
      im_in_queue: 0,
      is_chat_in_progress: 0,
      intake_form: astrologer.intake_form || 1,
      uniqeid: astrologer.uniqeid || "",
      requested_call_type: astrologer.requested_call_type || "",
      requested_call_status: astrologer.requested_call_status || "",
      in_progress_data: astrologer.in_progress_data || [],
      
      // Transform gallery images
      gallery_image_list: astrologer.gallery_images?.map(img => 
        `${hostUrl}${constants.astrologer_gellery}${img.image}`
      ) || [],
      
      // Include user information
      user: astrologer.user ? {
        id: astrologer.user.id,
        user_uni_id: astrologer.user.user_uni_id,
        name: astrologer.user.name,
        user_fcm_token: astrologer.user.user_fcm_token || "",
        user_ios_token: astrologer.user.user_ios_token || "",
        avg_rating: astrologer.user.avg_rating || "0.0",
        country_code: astrologer.user.country_code || "",
        full_info: `${astrologer.user.name} () {} [${astrologer.user.user_uni_id}] [InActive]`
      } : null,
      
      upcoming_live: astrologer.upcoming_live || "",
      user_category: astrologer.user_category || "",
      
      // Transform prices with discounted pricing
      prices: await transformPricesWithDiscounts(astrologer.prices, user_uni_id, astrologer_uni_id),
      
      // Keep gallery_images in original format too
      gallery_images: astrologer.gallery_images?.map(img => ({
        id: img.id,
        astrologer_uni_id: img.astrologer_uni_id,
        image: `${hostUrl}${constants.astrologer_gellery}${img.image}`,
        status: img.status,
        created_at: img.created_at,
        updated_at: img.updated_at
      })) || []
    };

    return res.status(200).json({
      status: 1,
      data: transformedData,
      msg: "Astrologer details retrieved successfully"
    });

  } catch (err) {
    console.error("Error fetching astrologer:", err);
    return res.status(500).json({ 
      status: 0, 
      message: "Internal server error",
      msg: "Internal server error"
    });
  }
});

export default router;