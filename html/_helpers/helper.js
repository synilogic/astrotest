import moment from "moment-timezone";
import SequenceCode from "../_models/sequence_code.js";
import ApiLog from "../_models/api_logs.js";
// import Op from "sequelize";
import {Op, Sequelize, literal } from "sequelize";
import blogs from "../_models/blog.js";
import BlogCategory from "../_models/blogCategory.js";
import User from "../_models/users.js";
import Astrologer from "../_models/astrologers.js";
import Follower from "../_models/followers.js";
import BlogLike from "../_models/blogLike.js";
import { constants, imagePath } from "../_config/constants.js";
import Course from "../_models/courses.js";
import CourseOrder from "../_models/course_order.js"
import fs from "fs"
import AskQuestion from '../_models/askQustion.js';
import Customer from '../_models/customers.js';
import path from 'path';
import { getAstrologerById, getTotalBalanceById, generateAgoraRtcToken, getCustomerById } from "./common.js";
import Offer from "../_models/offers.js";
import { getConfig } from "../configStore.js";
import Setting from "../_models/settings.js"
import offlineServiceCategory from "../_models/offlineServiceCategory.js";
import ServiceCategoryModel from "../_models/serviceCategory.js";
import ProductCategory from "../_models/productCategory.js";
import VideoSection from "../_models/videoSection.js";
import groupPujaCategory from "../_models/groupPujaCategory.js";
import Notice from "../_models/notices.js";
import ArchitectServiceOrder from "../_models/architectServiceOrder.js";
// import Offer from "../_models/o"

import CallHistory from "../_models/call_history.js";
import  ServiceOrder  from "../_models/serviceOrder.js";
import { formatDateTime } from "./dateTimeFormat.js";
import Wallet from "../_models/wallet.js";
import dayjs from "dayjs";
import AstrologerGift from "../_models/astrologer_gifts.js";
import GiftModel from "../_models/gifts.js";
import { TrainingVideo } from "../_models/trainingVideo.js";
import { ServiceAssign } from "../_models/serviceAssign.js";
import Service from "../_models/services.js";


function preZero(num, dig) {
  return num.toString().padStart(dig, '0');
}

export async function new_sequence_code(code)
{
  let rescode = await SequenceCode.findOne({ where: { sequence_code: code } });

  if (!rescode) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    rescode = await SequenceCode.create({
      sequence_code: code,
      sequence_number: '0000',
      created_at: now,
      updated_at: now
    });
  }

  let sequenceCode = parseInt(rescode.sequence_number, 10);
  sequenceCode += 1;

  const paddedCode = preZero(sequenceCode, 4);
  const uniqueId = `${code}${paddedCode}`;

  await SequenceCode.update(
    { sequence_number: paddedCode },
    { where: { sequence_code: code } }
  );

  return uniqueId;
}

export function strip_scripts_filter(content) {
  if (!content) return '';

  return content
    .replace(/<script>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/script/gi, '')
    .replace(/&lt;/gi, '')
    .replace(/&gt;/gi, '')
    .replace(/\/&lt;/gi, '')
    .replace(/\/&gt;/gi, '');
}

export function findArrayOfColumn(array, keySearch, valueSearch) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][keySearch] !== undefined && array[i][keySearch] === valueSearch) {
      return i; // return the index
    }
  }
  return null; // not found
}

// Middleware-style function
export async function saveApiLogs(req) {
  // return true;

  const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  const apiLogData = {
    request: JSON.stringify(req.body), // or req.query / req.params based on your use case
    url: currentUrl,
    response: ''
  };

  try {
    const apiLog = await ApiLog.create(apiLogData);
    return apiLog;
  } catch (error) {
    console.error('Error saving API log:', error);
    return null;
  }
}

export async function updateApiLogs(api, result) {
  // return true;

  const apiId = api.id;
  const responseData = { response: JSON.stringify(result) };

  try {
    await ApiLog.update(responseData, {
      where: { id: apiId }
    });
  } catch (error) {
    console.error('Error updating API log:', error);
  }
}

export const getAllBlog = async (filter) => {
  const limit = filter.limit || parseInt(constants.api_page_limit);
  const offset = filter.offset || 0;

  const whereClause = {};

  if (filter.status !== undefined) {
    whereClause.status = filter.status;
  }

  if (filter.astrologer_uni_id) {
    whereClause.auth_id = filter.astrologer_uni_id;
  }

  if (filter.blog_categories) {
    whereClause.blog_category_id = { [Op.in]: filter.blog_categories };
  }

  const include = [
    {
      model: Astrologer,
      as: 'astrologer',
      attributes: ['id', 'astrologer_uni_id', 'display_name', 'slug', 'astro_img'],
    },
    {
      model: User,
      as: 'user',
      attributes: ['id', 'user_uni_id', 'name', 'user_fcm_token', 'user_ios_token', 'avg_rating'],
      required: true, // Ensures user exists
    },
    {
      model: BlogCategory,
      as: 'blogcategory',
      attributes: ['id', 'slug'],
    },
    {
      model: Follower,
      as: 'followers',
      attributes: [],
      where: {
        status: 1
      },
      required: false,
    },
    {
      model: BlogLike,
      as: 'blog_likes',
      attributes: [],
      where: {
        status: 1
      },
      required: false,
    }
  ];

  // Blog category slug filter
  if (filter.blog_category_slug) {
    include[2].where = { slug: filter.blog_category_slug };
  }

  // Search filter
  if (filter.search) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${filter.search}%` } },
      literal(`EXISTS (
        SELECT 1 FROM astrologers WHERE astrologers.astrologer_uni_id = blogs.auth_id 
        AND astrologers.display_name LIKE '%${filter.search}%'
      )`)
    ];
  }

  const blogss = await blogs.findAll({
  where: whereClause,
  include,
  offset,
  limit,
  order: [['id', 'DESC']],
  attributes: {
    include: [
      // Is astro followed (returns boolean)
      [
        literal(`(
          SELECT IF(COUNT(*) > 0, true, false)
          FROM followers 
          WHERE followers.astrologer_uni_id = Blog.auth_id 
            AND followers.user_uni_id = '${filter.user_uni_id || ''}'
            AND followers.status = 1
        )`),
        'is_astro_follow'
      ],
      // Is blog liked (returns boolean)
      [
        literal(`(
          SELECT IF(COUNT(*) > 0, true, false)
          FROM blog_likes 
          WHERE blog_likes.blog_id = Blog.id 
            AND blog_likes.user_uni_id = '${filter.user_uni_id || ''}'
            AND blog_likes.status = 1
        )`),
        'is_likes'
      ],
      [
  literal(`(
    SELECT COUNT(*)
    FROM blog_likes 
    WHERE blog_likes.blog_id = Blog.id 
      AND blog_likes.status = 1
  )`),
  'like_count'
]
      
    ]
  }
});

  return blogss;
};

export const courseList = async ({ user_uni_id, search = '', offset = 0, limit }) => {
  const query = {
    where: {
      status: 1,
    },
    order: [['title', 'ASC']],
    offset: parseInt(offset),
    limit: parseInt(limit) || constants.api_page_limit,
  };

  // Search filter
  if (search && search.trim()) {
    query.where.title = {
      [Op.like]: `%${search.trim()}%`,
    };
  }

  // Fetch courses
  const courses = await Course.findAll(query);

  // Add payment status
  const results = await Promise.all(courses.map(async (course) => {
    const courseData = course.toJSON();
    
    const order = await CourseOrder.findOne({
      where: {
        course_id: course.id,
        user_uni_id,
        status: 1,
      },
    });

    courseData.payment_status = order ? 1 : 0;
    return courseData;
  }));

  return results;
};

export const coursePurchaseList = async (req) => {
  const user_uni_id = req.user_uni_id;
  const offset = parseInt(req.offset) || 0;
  const limit = parseInt(req.limit) || constants.api_page_limit_secondary;

  const orders = await CourseOrder.findAll({
    where: {
      user_uni_id,
      status: 1,
    },
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['title', 'description', 'course_image', 'video_type', 'video_url', 'whatsapp_group_link'],
        required: false, // LEFT JOIN
      }
    ],
    offset,
    limit,
    order: [['id', 'DESC']]
  });

  const result = orders.map(order => {
    const course = order.course || {};
    const courseImage = course.course_image;
    const courseImagePath = courseImage || '';

    const baseUrl = process.env.BASE_URL || "http://localhost:3000/"

    let imageUrl = '';
    if (courseImage && fs.existsSync(courseImagePath)) {
      imageUrl = `${baseUrl}${imagePath.course_image_path}${courseImage}`;
    } else {
      imageUrl = `${baseUrl}${imagePath.default_course_image_path}`;
    }

    let videoUrl = course.video_url || '';
    if (course.video_type === 'video_file' && videoUrl) {
      videoUrl = `${baseUrl}${imagePath.course_video_file_path}${videoUrl}`;
    }

    return {
      ...order.toJSON(),
      title: course.title || '',
      description: course.description || '',
      course_image: imageUrl,
      video_type: course.video_type || '',
      video_url: videoUrl,
      whatsapp_group_link: course.whatsapp_group_link || '',
    };
  });

  return result;
};

export const askQuestionCalculation = async (request) => {
  let ask_question_price = getConfig("ask_question_price");
  
  if (!ask_question_price || isNaN(ask_question_price)) {
    ask_question_price = 0;
  }

  const astrologerDetail = await getAstrologerById(request.astrologer_uni_id);
  if (astrologerDetail && astrologerDetail.ask_question_price && !isNaN(astrologerDetail.ask_question_price)) {
    ask_question_price = astrologerDetail.ask_question_price;
  }

  let useramount = await getTotalBalanceById(request.customer_uni_id);
  const astroDetail = await User.findOne({
    where: { user_uni_id: request.astrologer_uni_id, status: 1, role_id: 3 }
  });

  // const offerData = await Offer.findOne({
  //   where: { offer_code: request.offer_code, status: 1 }
  // });

  const curDate = moment();
  let msg = '';
  let coupon_status = '';

  if (ask_question_price > 0) {
    const subtotal = ask_question_price;
    let wallet_amount = 0;
    let payable_amount = 0;
    let reference_amount = 0;
    let offer_amount = 0;

    if (request.offer_code) {

      const offerData = await Offer.findOne({
    where: { offer_code: request.offer_code, status: 1 }
  });

      coupon_status = 0;
      if (offerData) {
        if (
          request.offer_code === offerData.offer_code &&
          curDate.isSameOrAfter(moment(offerData.offer_validity_from)) &&
          curDate.isSameOrBefore(moment(offerData.offer_validity_to))
        ) {
          if (
            subtotal > parseFloat(offerData.minimum_order_amount) &&
            subtotal < parseFloat(offerData.max_order_amount)
          ) {
            if (offerData.offer_category === 'amount') {
              offer_amount = parseFloat(offerData.discount_amount);
              coupon_status = '1';
            } else if (offerData.offer_category === 'percentage') {
              offer_amount = (subtotal * parseFloat(offerData.discount_amount)) / 100;
              coupon_status = '1';
            }
          } else {
            if (subtotal < parseFloat(offerData.minimum_order_amount)) {
              msg = `Minimum Order value ${offerData.minimum_order_amount}`;
            } else if (subtotal > parseFloat(offerData.max_order_amount)) {
              msg = `Maximum Order value ${offerData.max_order_amount}`;
            } else {
              msg = 'Coupon code expiry';
            }
          }
        } else {
          msg = 'Coupon code expiry';
        }
      } else {
        msg = 'Invalid Coupon code';
      }
    }

    const finalamount = subtotal - reference_amount - offer_amount;

    let admin_percentage = getConfig("admin_service_percentage");
    if (astroDetail && astroDetail.admin_percentage && parseInt(astroDetail.admin_percentage) > 0) {
      admin_percentage = astroDetail.admin_percentage;
    }

    let admin_amount = (finalamount * admin_percentage) / 100;
    let astrologer_amount = finalamount - admin_amount;

    let astrologer_tds_amount = 0;
    if (getConfig("tds_on_ask_question") === 1) {
      const tds = Config.tds;
      if (tds && tds > 0) {
        astrologer_tds_amount = parseFloat(((tds * astrologer_amount) / 100));
      }
      astrologer_amount = astrologer_amount - astrologer_tds_amount;
    }

    useramount = useramount || 0;

    if (request.wallet_check === 1) {
      if (useramount >= finalamount) {
        wallet_amount = finalamount;
        payable_amount = 0;
      } else if (useramount > 0) {
        wallet_amount = useramount;
        payable_amount = finalamount - useramount;
      } else {
        wallet_amount = 0;
        payable_amount = finalamount;
      }
    } else {
      wallet_amount = 0;
      payable_amount = finalamount;
    }

    const recharge_gst_percent = getConfig("gst") || 0;
    let recharge_gst_value = 0;

    if (payable_amount > 0 && recharge_gst_percent > 0) {
      recharge_gst_value = parseFloat(((payable_amount * recharge_gst_percent) / 100));
    }

    payable_amount += recharge_gst_value;

    const data = {
      //ask_question_price: parseFloat(ask_question_price),
      ask_question_price: ask_question_price.toString(),
      reference_amount: parseFloat(reference_amount),
      offer_ammount: parseFloat(offer_amount),
      subtotal: parseFloat(subtotal),
      finalamount: parseFloat(finalamount),
      wallet_amount: parseFloat(wallet_amount),
      recharge_gst_percent: parseFloat(recharge_gst_percent),
      recharge_gst_value: parseFloat(recharge_gst_value),
      payable_amount: parseFloat(payable_amount),
      admin_amount: parseFloat(admin_amount),
      admin_percentage: parseFloat(admin_percentage),
      astrologer_amount: parseFloat(astrologer_amount),
      astrologer_tds_amount: parseFloat(astrologer_tds_amount),
      my_wallet_amount: parseFloat(useramount),
      coupon_status: String(coupon_status),
    };

    if (payable_amount === 0) {
      msg = msg || 'Success';
      return {
        status: 1,
        data,
        msg
      };
    } else {
      msg = msg || 'Insufficient Wallet Balance';
      return {
        status: 1,
        error_code: 102,
        data,
        msg
      };
    }
  } else {
    return {
      status: 0,
      data: '',
      msg: 'Ask Question price is invalid',
    };
  }
};

export const askQuestionList = async (request) => {
  const {
    status,
    payment_status,
    answer_status,
    customer_uni_id,
    astrologer_uni_id,
    offset = 0,
    limit = constants.api_page_limit,
  } = request;

  const whereConditions = {};

  if (status !== undefined && status !== '') {
    whereConditions.status = status;
  }

  if (payment_status !== undefined && payment_status !== '') {
    whereConditions.payment_status = payment_status;
  }

  if (answer_status !== undefined && answer_status !== '') {
    whereConditions.answer_status = answer_status;
  }

  if (customer_uni_id !== undefined && customer_uni_id !== '') {
    whereConditions.customer_uni_id = customer_uni_id;
  }

  if (astrologer_uni_id !== undefined && astrologer_uni_id !== '') {
    whereConditions.astrologer_uni_id = astrologer_uni_id;
  }

  const results = await AskQuestion.findAll({
    where: whereConditions,
    include: [
      {
        model: User,
        as: 'user_customer',
        attributes: [],
      },
      {
        model: Customer,
        as: 'customer',
        attributes: [],
      },
      {
        model: User,
        as: 'user_astrologer',
        attributes: [],
      },
      {
        model: Astrologer,
        as: 'astrologer',
        attributes: [],
      },
    ],
    offset: parseInt(offset),
    limit: parseInt(limit),
    order: [['id', 'DESC']],
    attributes: {
      include: [
        [Sequelize.col('user_astrologer.name'), 'astrologer_name'],
        [Sequelize.col('user_customer.name'), 'customer_name'],
        [Sequelize.col('customer.customer_img'), 'customer_img'],
        [Sequelize.col('customer.birth_date'), 'birth_date'],
        [Sequelize.col('customer.gender'), 'gender'],
        [Sequelize.col('customer.birth_place'), 'birth_place'],
        [Sequelize.col('customer.birth_time'), 'birth_time'],
        [Sequelize.col('customer.longitude'), 'longitude'],
        [Sequelize.col('customer.latitude'), 'latitude'],
        [Sequelize.col('astrologer.astro_img'), 'astro_img'],
        [Sequelize.col('astrologer.ask_question_price'), 'ask_question_price'],
      ]
    }
  });

  const formattedResults = results.map((item) => {
    const data = item.toJSON();

    data.created_at = data.created_at ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"
    data.updated_at = data.updated_at ? dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss') : "N/A"

    return {
      ...data,
    };
  });

  return formattedResults;
};

export const getSettings = async (setting_type = '') => {
    try {
        const whereClause = { status: 1 };

        if (setting_type && setting_type !== '') {
            whereClause.setting_type = setting_type;
        }

        const settings = await Setting.findAll({
            where: whereClause,
            order: [['setting_label', 'ASC']]
        });

        return settings;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return [];
    }
}

export const OfflineServiceCategory = async (filter = {}) => {
  try {
    const where = { status: 1 };

    if (filter.status !== undefined && filter.status !== '') {
      where.status = filter.status;
    }

    const options = {
      where,
      order: [['title', 'ASC']],
      attributes: ["id", "parent_id", "title", "image"]
    };

    if (filter.offset !== undefined && filter.offset > -1) {
      options.offset = filter.offset;
      options.limit = filter.limit || parseInt(constants.api_page_limit || '10');
    }

    if (filter.search) {
      const keyword = filter.search;
      where.title = { [Op.like]: `%${keyword}%` };
    }

    const service = await offlineServiceCategory.findAll(options);

    for (const value of service) {
      const imgPath = path.join('public', constants.offline_service_category_image_path || 'uploads/offline_service_category/');
      value.image = value.image
        ? `${constants.offline_service_category_image_path}${value.image}`
        : process.env.DEFAULT_IMAGE_PATH;
    }

    return service;

  } catch (err) {
    console.error('Error in OfflineServiceCategory:', err);
    return [];
  }
};

 export const ServiceCategory = async (filter) => {
  const where = {
    status: '1'
  };

  // Override status if provided
  if (filter.status !== undefined && filter.status !== '') {
    where.status = filter.status;
  }

  // Apply search condition
  if (filter.search && filter.search.trim() !== '') {
    where.title = {
      [Op.like]: `%${filter.search.trim()}%`
    };
  }

  const offset = filter.offset > -1 ? filter.offset : 0;
  const limit = filter.limit || constants.api_page_limit;

  // Fetch from DB
  const categories = await ServiceCategoryModel.findAll({
    where,
    order: [['title', 'ASC']],
    offset,
    limit,
    attributes: ["id", "parent_id", "title", "image", "description"]
  });

  // Image path setup
  // const imagePath = path.join(process.cwd(), 'public', constants.service_category_image_path);
  // const defaultImage = `${constants.base_url}/${constants.default_image_path}`;

  // const updatedCategories = categories.map(category => {
  //   const imageFile = category.image ? path.join(imagePath, category.image) : '';
  //   const imageUrl = category.image && fs.existsSync(imageFile)
  //     ? `${constants.base_url}/${constants.service_category_image_path}${category.image}`
  //     : defaultImage;

  //   return {
  //     ...category.toJSON(),
  //     image: imageUrl
  //   };
  // });

  return categories;
};

export const getBlogs = async (filter) => {
  const limit = filter.limit || parseInt(constants.api_page_limit);
  const offset = filter.offset || 0;

  const whereClause = {};

  if (filter.status !== undefined) {
    whereClause.status = filter.status;
  }

  if (filter.astrologer_uni_id) {
    whereClause.auth_id = filter.astrologer_uni_id;
  }

  if (filter.blog_categories) {
    whereClause.blog_category_id = { [Op.in]: filter.blog_categories };
  }

  const include = [
    {
      model: Astrologer,
      as: 'astrologer',
      attributes: ['id', 'astrologer_uni_id', 'display_name', 'slug', 'astro_img'],
    },
    {
      model: User,
      as: 'user',
      attributes: ['id', 'user_uni_id', 'name', 'user_fcm_token', 'user_ios_token', 'avg_rating'],
      required: true, // Ensures user exists
    },
    {
      model: BlogCategory,
      as: 'blogcategory',
      attributes: ['id', 'slug'],
    },
    {
      model: Follower,
      as: 'followers',
      attributes: [],
      where: {
        status: 1
      },
      required: false,
    },
    {
      model: BlogLike,
      as: 'blog_likes',
      attributes: [],
      where: {
        status: 1
      },
      required: false,
    }
  ];

  // Blog category slug filter
  if (filter.blog_category_slug) {
    include[2].where = { slug: filter.blog_category_slug };
  }

  // Search filter
  if (filter.search) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${filter.search}%` } },
      literal(`EXISTS (
        SELECT 1 FROM astrologers WHERE astrologers.astrologer_uni_id = blogs.auth_id 
        AND astrologers.display_name LIKE '%${filter.search}%'
      )`)
    ];
  }

  const blogss = await blogs.findAll({
    where: whereClause,
    include,
    offset,
    limit,
    order: [['id', 'DESC']],
    attributes: {
      include: [
        // Is astro followed
        [
          literal(`(
            SELECT COUNT(*) FROM followers 
            WHERE followers.astrologer_uni_id = Blog.auth_id 
              AND followers.user_uni_id = '${filter.user_uni_id || ''}'
              AND followers.status = 1
          ) > 0`),
          'is_astro_follow'
        ],
        // Is blog liked
        [
          literal(`(
            SELECT COUNT(*) FROM blog_likes 
            WHERE blog_likes.blog_id = Blog.id 
              AND blog_likes.user_uni_id = '${filter.user_uni_id || ''}'
              AND blog_likes.status = 1
          ) > 0`),
          'is_likes'
        ]
      ]
    }
  });

  return blogss;
};

 export const GroupPujaCategory = async (filter) => {
  const where = {
    status: '1'
  };

  // If a specific status is passed
  if (filter.status !== undefined && filter.status !== '') {
    where.status = filter.status;
  }

  // If a search keyword is passed
  if (filter.search && filter.search.trim() !== '') {
    where.title = {
      [Op.like]: `%${filter.search.trim()}%`
    };
  }

  const offset = filter.offset > -1 ? filter.offset : 0;
  const limit = filter.limit || constants.api_page_limit;

  // Query
  const groupPujaCategories = await groupPujaCategory.findAll({
    where,
    order: [['title', 'ASC']],
    offset,
    limit,
    raw:true
  });



  return groupPujaCategories;
};

 export const getProductCategory = async (filter = {}) => {
  const where = {};

  // Status filter
  if (filter.status !== undefined && filter.status !== '') {
    where.status = filter.status;
  } else {
    where.status = 1;
  }

  // Search filter
  if (filter.search && filter.search.trim() !== '') {
    where.title = {
      [Op.like]: `%${filter.search.trim()}%`
    };
  }

  // Pagination
  const offset = filter.offset && filter.offset > -1 ? filter.offset : 0;
  const limit = filter.limit || constants.api_page_limit;

  // Querying DB
  const productCategories = await ProductCategory.findAll({
    where,
    order: [['title', 'ASC']],
    offset,
    limit,
    attributes: ["id", "title", "image"]
  });

  // Image Handling
  const imgDir = path.join(process.cwd(), 'public', constants.product_category_image_path);
  const defaultImage = `${constants.base_url}${constants.default_product_image_path}`;

  const result = productCategories.map((cat) => {
    const filePath = cat.image ? path.join(imgDir, cat.image) : '';
    const imageUrl = cat.image && fs.existsSync(filePath)
      ? `${constants.base_url}${constants.product_category_image_path}${cat.image}`
      : defaultImage;

    return {
      ...cat.toJSON(),
      image: imageUrl
    };
  });

  return result;
};

 export const getVideoSections = async (filter) => {
  // Handle status - can be 1, '1', or both
  const where = {
    [Op.or]: [
      { status: 1 },
      { status: '1' }
    ]
  };

  // Search filter
  if (filter.search && filter.search.trim() !== '') {
    where[Op.and] = [
      ...(where[Op.and] || []),
      {
        [Op.or]: [
          { title: { [Op.like]: `%${filter.search.trim()}%` } },
          { url: { [Op.like]: `%${filter.search.trim()}%` } }
        ]
      }
    ];
  }

  // Pagination
  const offset = filter.offset && filter.offset > -1 ? filter.offset : 0;
  const limit = filter.limit || constants.api_page_limit || 20;
 
  console.log('[getVideoSections] Query where clause:', JSON.stringify(where, null, 2));
  console.log('[getVideoSections] Offset:', offset, 'Limit:', limit);

  try {
    // Query the database
    const videoSections = await VideoSection.findAll({
      where,
      order: [['id', 'DESC']],
      offset,
      limit,
      attributes: ["id", "title", "video_type", "url", "status"]
    });

    console.log('[getVideoSections] Raw query result count:', videoSections.length);

    // Add embedded video field
    const result = videoSections.map((item) => {
      const data = item.toJSON();
      data.embedd = data.url || '';
      console.log('[getVideoSections] Video item:', { id: data.id, title: data.title, url: data.url, status: data.status });
      return data;
    });

    console.log('[getVideoSections] Final result count:', result.length);
    return result;
  } catch (error) {
    console.error('[getVideoSections] Database query error:', error);
    console.error('[getVideoSections] Error stack:', error.stack);
    throw error;
  }
};

 export const getNoticeForApp = async () => {
  const notice = await Notice.findOne({
    where: {
      status: '1',
      notice_for: {
        [Op.in]: ['app', 'all']
      }
    },
    order: [['id', 'DESC']]
  });

  return notice;
};


export const inProgressChatDetailForCustomer = async (customer_uni_id = '') => {
  const details = {
    status: 0,
    join_status: 0,
    call_type: '',
    astro_name: '',
    astro_image: '',
    astro_uni_id: '',
    uniqeid: '',
    channel_name: '',
    token: '',
    is_virtual: 0,
    charge: 0,
  };


  if (!customer_uni_id) return details;

  const call_type_list = ['call', 'chat', 'video'];

  const inProgressCallOrder = await CallHistory.findOne({
    where: {
      customer_uni_id,
      status: { [Op.in]: ['request', 'in-progress'] },
      call_type: { [Op.in]: call_type_list },
      [Op.or]: [
        { call_type: { [Op.ne]: 'call' } },
        { is_inapp_voice_call: 1 }
      ]
    },
    include: [
      { model: User, as: 'user', attributes: ['name'] },
      { model: Astrologer, as: 'astrologer', attributes: ['display_name', 'astro_img', 'is_virtual'] }
    ],
  });

  if (inProgressCallOrder) {
    const astro = inProgressCallOrder.astrologer || {};
  
   
    const callType = inProgressCallOrder.call_type;
    details.status = 1;
    details.join_status = 2;
    details.call_type = callType;
    details.astro_name = astro.display_name || '';
    details.astro_image = "https://astro.synilogictech.com/assets/img/astrologer.jpg";
    details.astro_uni_id = inProgressCallOrder.astrologer_uni_id;
    details.uniqeid = inProgressCallOrder.uniqeid;
    details.is_virtual = astro.is_virtual || 0;
    details.charge = inProgressCallOrder.offer_type !== 3 ? parseFloat(inProgressCallOrder.charge || 0) : 0;

    if (callType === 'chat') {
      details.channel_name = `CHAT/${customer_uni_id}-${inProgressCallOrder.astrologer_uni_id}`;
    } else if (callType === 'video') {
      details.channel_name = `CHAT/${customer_uni_id}-${inProgressCallOrder.astrologer_uni_id}-Video`;
    } else if (callType === 'call') {
      details.channel_name = `CHAT/${customer_uni_id}-${inProgressCallOrder.astrologer_uni_id}-Call`;
    }

    if (['call', 'video'].includes(callType)) {
      const customer = await getCustomerById(customer_uni_id);
      if (customer) {
        const tokenData = await generateAgoraRtcToken({
          uniqeid: inProgressCallOrder.uniqeid,
          user_uni_id: customer_uni_id,
          user_id: customer.id
        });
        if (tokenData?.token) {
          details.token = tokenData.token;
        }
      }
    }

    return details;
  }

  // Check for active service video order
  const serviceOrder = await ServiceOrder.findOne({
    where: {
      customer_uni_id,
      status: 'approved',
      start_time: { [Op.ne]: null },
      [Op.and]: literal(`UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(start_time) < available_duration * 60`)
    },
    include: [
      { model: Astrologer, as: 'astrologerService', attributes: ['display_name', 'astro_img', 'is_virtual'] },
      { model: User, as: 'userService', attributes: ['name'] }
    ]
  });

  if (serviceOrder) {
    const astro = serviceOrder.astrologer || {};
    const astro_img = astro.astro_img;
    const imgPath = path.join(constants.public_path, constants.astrologer_image_path, astro_img || '');
    const imageExists = astro_img && fs.existsSync(imgPath);

    const astroImageUrl = imageExists
      ? `${constants.base_url}${constants.astrologer_image_path}${astro_img}`
      : `${constants.base_url}${constants.default_astrologer_image_path}`;

    details.status = 1;
    details.join_status = 2;
    details.call_type = 'service_video';
    details.astro_name = astro.display_name || '';
    details.astro_image = astroImageUrl;
    details.astro_uni_id = serviceOrder.astrologer_uni_id;
    details.uniqeid = serviceOrder.order_id;
    details.channel_name = '';
    details.is_virtual = astro.is_virtual || 0;
    details.charge = 0;

    const tokenData = await generateAgoraRtcToken({
      uniqeid: serviceOrder.order_id,
      user_uni_id: serviceOrder.customer_uni_id,
      user_id: 0
    });
    if (tokenData?.token) {
      details.token = tokenData.token;
    }
  }

  return details;
};


export async function getArchitectServiceInProgressStatusForCustomer(customer_uni_id) {
  try {
    const count = await ArchitectServiceOrder.count({
      where: {
        customer_uni_id,
        status: "approved",
      },
    });

    return count > 0 ? 1 : 0;
  } catch (error) {
    console.error("Error in getArchitectServiceInProgressStatusForCustomer:", error);
    return 0; // safe fallback
  }
};

export const getWalletHistory = async ({ user_uni_id, from, to, offset = 0, limit = 10 }) => {
  const whereClause = {};

  if (user_uni_id) {
    whereClause.user_uni_id = user_uni_id;
  }

  if (from) {
    whereClause.created_at = { ...(whereClause.created_at || {}), [Op.gte]: from };
  }

  if (to) {
    whereClause.created_at = { ...(whereClause.created_at || {}), [Op.lte]: to };
  }

  const result = await Wallet.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: [],
        required: false,
      },
    ],
    attributes: {
      include: [
        // Normalized amount fields (prevent division by zero)
        [Sequelize.literal(`CASE WHEN Wallet.transaction_amount = 0 THEN 0 ELSE Wallet.transaction_amount / NULLIF(Wallet.exchange_rate, 0) END`), 'transaction_amount'],
        [Sequelize.literal(`CASE WHEN Wallet.amount = 0 THEN 0 ELSE Wallet.amount / NULLIF(Wallet.exchange_rate, 0) END`), 'amount'],
        [Sequelize.literal(`CASE WHEN Wallet.gst_amount = 0 THEN 0 ELSE Wallet.gst_amount / NULLIF(Wallet.exchange_rate, 0) END`), 'gst_amount'],
        [Sequelize.literal(`CASE WHEN Wallet.astro_amount = 0 THEN 0 ELSE Wallet.astro_amount / NULLIF(Wallet.exchange_rate, 0) END`), 'astro_amount'],
        [Sequelize.literal(`CASE WHEN Wallet.admin_amount = 0 THEN 0 ELSE Wallet.admin_amount / NULLIF(Wallet.exchange_rate, 0) END`), 'admin_amount'],
        [Sequelize.literal(`CASE WHEN Wallet.tds_amount = 0 THEN 0 ELSE Wallet.tds_amount / NULLIF(Wallet.exchange_rate, 0) END`), 'tds_amount'],
        [Sequelize.literal(`CASE WHEN Wallet.offer_amount = 0 THEN 0 ELSE Wallet.offer_amount / NULLIF(Wallet.exchange_rate, 0) END`), 'offer_amount'],
        [Sequelize.literal(`CASE WHEN Wallet.gateway_charge = 0 THEN 0 ELSE Wallet.gateway_charge / NULLIF(Wallet.exchange_rate, 0) END`), 'gateway_charge'],
        [Sequelize.literal(`CASE WHEN Wallet.coupan_amount = 0 THEN 0 ELSE Wallet.coupan_amount / NULLIF(Wallet.exchange_rate, 0) END`), 'coupan_amount'],
        [Sequelize.col('user.phone'), 'phone'],
        [Sequelize.col('user.name'), 'name'],
        [Sequelize.col('user.email'), 'email'],
      ],
    },
    order: [['id', 'DESC']],
    offset: offset,
    limit: limit,
    raw: true,
    nest: true,
  });

  return result;
}

export async function userCallHistory(call_history) {
  const limit = call_history.limit || config.api_page_limit;
  const offset = call_history.offset || 0;

  const callTypeFilter = {};
  if (call_history.call_type) {
    if (call_history.call_type === 'live') {
      callTypeFilter.call_type = {
        [Op.in]: ['videocallwithlive', 'callwithlive', 'privatecallwithlive', 'privatevideocallwithlive']
      };
    } else {
      callTypeFilter.call_type = call_history.call_type;
    }
  }

  const statusFilter = {};
  if (call_history.status && call_history.status !== 'all') {
    statusFilter.status = call_history.status;
  } else if (!call_history.status || call_history.status === '') {
    statusFilter.status = 'completed';
  }

  const results = await CallHistory.findAll({
    where: {
      customer_uni_id: call_history.user_uni_id,
      ...callTypeFilter,
      ...statusFilter,
    },
    include: [
      {
        model: User,
        required: false,
        attributes: [],
        as: 'astrologer_user',
        // on: {
        //   '$astrologer_user.user_uni_id$': Sequelize.col('call_history.astrologer_uni_id'),
        // },
      },
      {
        model: Astrologer,
        as: 'astrologer',
        required: false,
        attributes: [],
      },
      {
        model: Wallet,
        as: 'Wallet',
        required: false,
        attributes: [],
        on: {
          [Op.and]: [
            Sequelize.where(Sequelize.col('Wallet.user_uni_id'), '=', Sequelize.col('call_history.customer_uni_id')),
            Sequelize.where(Sequelize.col('Wallet.reference_id'), '=', Sequelize.col('call_history.uniqeid')),
          ]
        }
      }
    ],
    attributes: {
      include: [
        [Sequelize.col('Wallet.user_uni_id'), 'user_uni_id'],
        [Sequelize.col('Wallet.reference_id'), 'reference_id'],
        [Sequelize.col('Wallet.gateway_order_id'), 'gateway_order_id'],
        [Sequelize.col('Wallet.gateway_payment_id'), 'gateway_payment_id'],
        [Sequelize.col('Wallet.transaction_code'), 'transaction_code'],
        [Sequelize.col('Wallet.wallet_history_description'), 'wallet_history_description'],
        [literal('ROUND(IFNULL(`Wallet`.`transaction_amount` / NULLIF(`Wallet`.`exchange_rate`, 0), 0), 2)'), 'transaction_amount'],
        [Sequelize.col('Wallet.amount'), 'amount'],
        [Sequelize.col('Wallet.main_type'), 'main_type'],
        [Sequelize.col('Wallet.created_by'), 'created_by'],
        [literal('ROUND(IFNULL(`Wallet`.`admin_percentage`, 0), 2)'), 'admin_percentage'],
        [literal('ROUND(IFNULL(`Wallet`.`gst_amount` / NULLIF(`Wallet`.`exchange_rate`, 0), 0), 2)'), 'gst_amount'],
        [literal('ROUND(IFNULL(`Wallet`.`astro_amount` / NULLIF(`Wallet`.`exchange_rate`, 0), 0), 2)'), 'astro_amount'],
        [literal('ROUND(IFNULL(`Wallet`.`admin_amount` / NULLIF(`Wallet`.`exchange_rate`, 0), 0), 2)'), 'admin_amount'],
        [literal('ROUND(IFNULL(`Wallet`.`tds_amount` / NULLIF(`Wallet`.`exchange_rate`, 0), 0), 2)'), 'tds_amount'],
        [literal('ROUND(IFNULL(`Wallet`.`offer_amount` / NULLIF(`Wallet`.`exchange_rate`, 0), 0), 2)'), 'offer_amount'],
        [literal('ROUND(IFNULL(`Wallet`.`gateway_charge` / NULLIF(`Wallet`.`exchange_rate`, 0), 0), 2)'), 'gateway_charge'],
        [literal('ROUND(IFNULL(`Wallet`.`coupan_amount` / NULLIF(`Wallet`.`exchange_rate`, 0), 0), 2)'), 'coupan_amount'],
        [Sequelize.col('Wallet.currency'), 'currency'],
        [Sequelize.col('Wallet.payment_method'), 'payment_method'],
        [Sequelize.col('Wallet.where_from'), 'where_from'],
        [Sequelize.col('Wallet.gift_status'), 'gift_status'],
        [Sequelize.col('Wallet.offer_status'), 'offer_status'],
        [Sequelize.col('Wallet.currency_code'), 'currency_code'],
        [Sequelize.col('Wallet.currency_symbol'), 'currency_symbol'],
        [Sequelize.col('Wallet.exchange_rate'), 'exchange_rate'],
        [Sequelize.col('Wallet.created_at'), 'created_at'],
        [Sequelize.col('Wallet.updated_at'), 'updated_at'],
        [literal('ROUND(IFNULL(SUM(`Wallet`.`amount` / NULLIF(`Wallet`.`exchange_rate`, 0)), 0), 2)'), 'amount'],
        [literal(`(
          SELECT CASE 
            WHEN EXISTS (
              SELECT 1 FROM call_history_images AS chi 
              WHERE chi.uniqeid = call_history.uniqeid
            )
            THEN 1 ELSE 0
          END
        )`), 'call_history_images_exists'],
        [Sequelize.col('astrologer.display_name'), 'display_name'],
        [Sequelize.col('astrologer.astro_img'), 'astro_img'],
        [Sequelize.col('astrologer_user.phone'), 'phone'],
        [Sequelize.col('astrologer_user.name'), 'name'],
        [Sequelize.col('astrologer_user.email'), 'email'],
        [Sequelize.col('astrologer_user.user_fcm_token'), 'user_fcm_token'],
        [Sequelize.col('astrologer_user.user_ios_token'), 'user_ios_token'],
        [Sequelize.col('astrologer_user.country_name'), 'country_name'],
      ]
    },
    group: [
  'call_history.id',
  'Wallet.user_uni_id',
  'Wallet.reference_id',
  'Wallet.gateway_order_id',
  'Wallet.gateway_payment_id',
  'Wallet.transaction_code',
  'Wallet.transaction_amount',
  'Wallet.wallet_history_description',
  'Wallet.amount',
  'Wallet.main_type',
  'Wallet.created_by',
  'Wallet.admin_percentage',
  'Wallet.gst_amount',
  'Wallet.astro_amount',
  'Wallet.admin_amount',
  'Wallet.tds_amount',
  'Wallet.offer_amount',
  'Wallet.gateway_charge',
  'Wallet.coupan_amount',
  'Wallet.currency',
  'Wallet.payment_method',
  'Wallet.where_from',
  'Wallet.gift_status',
  'Wallet.offer_status',
  'Wallet.currency_code',
  'Wallet.currency_symbol',
  'Wallet.exchange_rate',
  'Wallet.created_at',
  'Wallet.updated_at',
  'astrologer.display_name',
  'astrologer.astro_img',
  'astrologer_user.phone',
  'astrologer_user.name',
  'astrologer_user.email',
  'astrologer_user.user_fcm_token',
  'astrologer_user.user_ios_token',
  'astrologer_user.country_name'
],
    order: [['id', 'DESC']],
    offset,
    limit,
    raw: true,
    nest: true,
  });

  // const imagePath = path.join(__dirname, '..', 'public', config.astrologer_image_path);
  return results.map(row => {
    row.call_start = row.call_start ? dayjs(row.call_start).format('YYYY-MM-DD HH:mm:ss'): "N/A"
    row.call_end = row.call_end ? dayjs(row.call_end).format('YYYY-MM-DD HH:mm:ss'): "N/A"
    // row.created_at = row.created_at ? dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss'): "N/A"
    row.created_at = row.created_at ? moment(row.created_at).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'): "N/A"
    row.updated_at = row.updated_at ? dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss'): "N/A"
    row.waiting_for_request = row.waiting_for_request ? dayjs(row.waiting_for_request).format('YYYY-MM-DD HH:mm:ss'): "N/A"
    row.ivr_start_from = row.ivr_start_from ? dayjs(row.ivr_start_from).format('YYYY-MM-DD HH:mm:ss'): "N/A"
    // Ensure reference_id is filled
    if (!row.reference_id) {
      row.reference_id = row.uniqeid;
    }

    return row;
  });
}

export const userGiftHistory = async (filter) => {
  return await getQueryUser(filter);
}

export const getQueryUser = async (filter) => {
  let {
    user_uni_id,
    offset = 0,
    gift_type = "",
    livechannel = "",
  } = filter;

  const pageLimit = constants.api_page_limit_secondary;

  const whereClause = {
    user_id: user_uni_id,
  };

  if (gift_type === "live") {
    whereClause.livechannel = {
      [Op.ne]: null,
    };
  } else if (gift_type === "profile") {
    whereClause[Op.or] = [
      { livechannel: null },
      { livechannel: "" },
    ];
  }

  if (livechannel) {
    whereClause.livechannel = livechannel;
  }

  if(filter.offset === '' || filter.offset === null) {
    filter.offset = 0
    offset = 0
  }

  const giftHistory = await AstrologerGift.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: "user_astrologer",
        attributes: ["id", "user_uni_id", "name", "user_fcm_token", "user_ios_token", "avg_rating"],
      },
      {
        model: GiftModel,
        as: "gift",
      },
      {
        model: Astrologer,
        as: "astrologer",
        attributes: ["id", "astrologer_uni_id", "display_name", "slug", "astro_img"],
      },
    ],
    offset: offset,
    limit: pageLimit,
    order: [["id", "DESC"]],
  });

  return giftHistory;
};

export const astroGiftHistory = async (filters) => {
  const whereClause = {
    astrologer_uni_id: filters.astrologer_uni_id,
  };

  // Apply gift_type filter
  if (filters.gift_type === 'live') {
    whereClause.livechannel = {
      [Op.and]: {
        [Op.ne]: null,
        [Op.ne]: '',
      },
    };
  } else if (filters.gift_type === 'profile') {
    whereClause[Op.or] = [
      { livechannel: null },
      { livechannel: '' },
    ];
  }

  // Apply livechannel exact match filter
  if (filters.livechannel) {
    whereClause.livechannel = filters.livechannel;
  }

  const giftHistory = await AstrologerGift.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user_customer',
        attributes: ['id', 'user_uni_id', 'name', 'user_fcm_token', 'user_ios_token', 'avg_rating'],
      },
      {
        model: GiftModel,
        as: 'gift',
      },
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'customer_uni_id', 'customer_img'],
      },
    ],
    order: [['id', 'DESC']],
  });

  return giftHistory;
};

export const trainingVideoList = async (filter = {}) => {
  const where = { status: 1 };

  if (filter.search) {
    where.title = { [Op.like]: `%${filter.search}%` };
  }

  if (filter.user_type) {
    where.user_type = { [Op.like]: `%${filter.user_type}%` };
  }

  const queryOptions = {
    where,
    order: [['id', 'DESC']],
  };

  if (typeof filter.offset !== 'undefined' && filter.offset > -1) {
    queryOptions.offset = filter.offset;
    queryOptions.limit = constants.api_page_limit || 10;
  }

  const results = await TrainingVideo.findAll(queryOptions);

  // return results.map(video => ({
  //   ...video.toJSON(),
  //   embedd: video.url ? getEmbeddedVideos(video.url, '100%', '100%') : '',
  // }));

  return results;
};

export const getFollowers = async ({ user_uni_id, offset = 0, limit = 10, status }) => {
  // Build the `where` condition dynamically
  const whereCondition = {
    astrologer_uni_id: user_uni_id,
  };
  if (status !== undefined && (status === 0 || status === 1)) {
    whereCondition.status = status;
  }

  const followers = await Follower.findAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: 'user',
        attributes: []
      },
      {
        model: Customer,
        as: 'customer',
        attributes: []
      },
      {
        model: Astrologer,
        as: 'astrologer',
        attributes: [],
        include: [
          {
            model: User,
            as: 'user',
            attributes: []
          },
        ],
      },
    ],
    offset: Number(offset),
    limit: Number(limit),
    attributes: {
      include: [
        [Sequelize.col('user.name'), 'customer_name'],
        [Sequelize.col('user.email'), 'customer_email'],
        [Sequelize.col('user.phone'), 'customer_phone'],
        [Sequelize.col('customer.customer_img'), 'customer_img'],
        [Sequelize.col('astrologer.astro_img'), 'astrologer_img'],
        [Sequelize.col('astrologer.display_name'), 'astrologer_display_name'],
        [Sequelize.col('astrologer.user.name'), 'astrologer_name'],
        [Sequelize.col('astrologer.user.email'), 'astrologer_email'],
        [Sequelize.col('astrologer.user.phone'), 'astrologer_phone'],
      ]
    }
  });

  return followers;
};



export const astrologerServiceOrder = async (filter) =>  {
  try {
    const where = {
      payment_status: { [Op.ne]: 'unpaid' }
    };

    if (filter.astrologer_uni_id) {
      where.astrologer_uni_id = filter.astrologer_uni_id;
    }

    const options = {
      where,
      include: [
        {
          model: User,
          as: 'user_customer',
          attributes: ['id', 'user_uni_id', 'name', 'user_fcm_token', 'user_ios_token', 'avg_rating'],
          required: true
        },
        {
          model: ServiceAssign,
          as: 'service_assign',
          include: [
            {
              model: Service,
              as: 'service',
              attributes: ['id', 'service_category_id', 'service_name', 'slug', 'service_image', 'service_description']
            }
          ],
          required: true
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_uni_id', 'customer_img'],
          required: true
        }
      ],
      order: [['id', 'DESC']]
    };

    if (filter.offset !== undefined && filter.offset > -1) {
      options.offset = filter.offset;
      options.limit = constants.api_page_limit;
    }

    let customer = await ServiceOrder.findAll(options);

    customer = await Promise.all(
      customer.map(async (order) => {
        const serviceDateTime = moment(`${order.date} ${order.time}`, 'YYYY-MM-DD HH:mm:ss');
        const bufferMinutes = constants.service_available_time || 0;
        const now = moment(getConfig('current_datetime'));

        const time = moment(serviceDateTime).subtract(bufferMinutes, 'minutes');
        const available_duration = moment(serviceDateTime).add(order.available_duration || 0, 'minutes');

        order.is_available =
          order.status === 'approved' &&
          now.isSameOrAfter(time) &&
          now.isSameOrBefore(available_duration)
            ? 1
            : 0;

        order.service_assign = order.service_assign || [];

        if (order.start_time && order.status === 'approved') {
          const durationInSeconds = (order.available_duration || 0) * 60;
          const serviceTime = moment(order.start_time).unix();
          const nowTime = moment().unix();
          const timeDiff = nowTime - serviceTime;
          const remaining = durationInSeconds - timeDiff;

          if (remaining <= 0) {
            await ServiceOrder.update(
              { status: 'completed' },
              { where: { id: order.id } }
            );
          }
        }

        return order;
      })
    );

    return customer;
  } catch (error) {
    console.error('astrologerServiceOrder error:', error);
    return [];
  }
};