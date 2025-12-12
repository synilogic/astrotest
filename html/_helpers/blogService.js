
import { Op, Sequelize } from 'sequelize';
import Blog from '../_models/blog.js';
import UserModel from '../_models/users.js';
import Astrologer from '../_models/astrologers.js';
import BlogCategory from '../_models/blogCategory.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { formatDateTime } from "./dateTimeFormat.js";
import { constants } from "../_config/constants.js";

dayjs.extend(relativeTime);

export const getAllBlog = async (filter, req) => {
  try {
    const blogs = await getQuery(filter, req);
    return blogs;
  } catch (error) {
    console.error('Error in getAllBlog:', error);
    throw error;
  }
};

export const getQuery = async (filter, req) => {
  const limit = filter.limit || 6; // Default limit
  const offset = filter.offset || 0;

  // Build where conditions
  const whereConditions = {};
  const includeConditions = [];

  // Add search functionality
  if (filter.search) {
    whereConditions[Op.or] = [
      {
        title: {
          [Op.like]: `%${filter.search}%`
        }
      }
    ];
  }

  // Add astrologer filter
  if (filter.astrologer_uni_id) {
    whereConditions.auth_id = filter.astrologer_uni_id;
  }


  // Add status filter
  if (filter.status !== undefined && filter.status !== '') {
    whereConditions.status = filter.status;
  }

  // Include associations
  includeConditions.push(
    {
      model: Astrologer,
      as: 'astrologer',
      required: false,
      attributes: [
        'id',
        'astrologer_uni_id',
        'display_name',
        'slug',
        'astro_img'
      ],
      where: filter.search ? {
        display_name: {
          [Op.like]: `%${filter.search}%`
        }
      } : undefined
    },
    {
      model: UserModel,
      as: 'user',
      required: true, // This ensures blogs with valid users only
      attributes: [
        'id',
        'user_uni_id',
        'name',
        'user_fcm_token',
        'user_ios_token',
        'avg_rating'
      ]
    },
  );

  // Remove undefined where conditions from includes
  includeConditions.forEach(include => {
    if (include.where && Object.keys(include.where).length === 0) {
      delete include.where;
    }
  });

  const blogs = await Blog.findAll({
    where: whereConditions,
    include: includeConditions,
    order: [['id', 'DESC']],
    limit: limit,
    offset: offset,
    attributes: [
      'id',
      'blog_category_id',
      'auth_id',
      'title',
      'slug',
      'blog_image',
      'meta_title',
      'meta_key',
      'content',
      'meta_description',
      'total_views',
      'status',
      'created_at',
      'updated_at'
    ]
  });

  // Process blogs to add computed fields
  const processedBlogs = blogs.map(blog => {
    const blogData = blog.toJSON();
    
    // Add computed fields
    blogData.astro_follow_count = 3; // You can calculate this from your follow table
    blogData.like_count = 0; // You can calculate this from your like table
    blogData.is_astro_follow = false; // You can check if current user follows this astrologer
    blogData.is_likes = false; // You can check if current user liked this blog
    blogData.day = dayjs(blogData.created_at).fromNow(); // Relative time
    blogData.created_at =  formatDateTime(blogData.created_at); // Relative time
    blogData.updated_at =  formatDateTime(blogData.created_at); // Relative time
    
  const hostUrl = `${req.protocol}://${req.get("host")}/`;

    // Format blog_image URL
    if (blogData.blog_image) {
      blogData.blog_image = `${hostUrl}${constants.blog_image_path}${blogData.blog_image}`;
    }
    
    // Format astrologer image URL
    if (blogData.astrologer && blogData.astrologer.astro_img && !blogData.astrologer.astro_img.startsWith('http')) {
      blogData.astrologer.astro_img = `${hostUrl}${constants.astrologer_image_path}${blogData.astrologer.astro_img}`;
    }
    
    // Add user full_info
    if (blogData.user) {
      blogData.user.full_info = `${blogData.user.name} () {} [${blogData.user.user_uni_id}] [InActive]`;
    }

    return blogData;
  });

  return processedBlogs;
};