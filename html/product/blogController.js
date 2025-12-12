import BlogLike from '../_models/blogLike.js';
import Blog from '../_models/blog.js';
import BlogCategory from '../_models/blogCategory.js';
import Astrologer from '../_models/astrologers.js';
import User from '../_models/users.js';
import Followers from '../_models/followers.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';
import Joi from 'joi';
import moment from 'moment';

export const blogLike = async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    blog_id: Joi.string().required(),
    status: Joi.number().valid(0, 1).required(),
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

  const { api_key, user_uni_id, blog_id, status } = value;

  if (!await checkUserApiKey(api_key, user_uni_id)) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  const msg = status === 1 ? 'Liked' : 'Disliked';
  const existing = await BlogLike.findOne({ where: { blog_id, user_uni_id, status } });

  let result;
  if (!existing) {
    const likeRecord = await BlogLike.findOne({ where: { blog_id, user_uni_id } });
    if (!likeRecord) {
      await BlogLike.create({ blog_id, user_uni_id, status });
    } else {
      await BlogLike.update({ status }, { where: { blog_id, user_uni_id } });
    }
    result = { status: 1, msg: `Successfully ${msg}` };
  } else {
    result = { status: 0, msg: `Already ${msg}` };
  }
  return res.json(result);
};

export const deleteBlog = async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    id: Joi.number().required(),
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

  const { api_key, astrologer_uni_id, id } = value;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  const blog = await Blog.findOne({ where: { id, auth_id: astrologer_uni_id } });

  if (blog) {
    await Blog.destroy({ where: { id } });
    return res.json({ status: 1, msg: 'Blog deleted successfully' });
  } else {
    return res.json({ status: 0, msg: 'No record found' });
  }
};

export const addBlog = async (req, res) => {
  const schema = Joi.object({
    astrologer_uni_id: Joi.string().required(),
    blog_title: Joi.string().required(),
    blog_content: Joi.string().required(),
    blog_image: Joi.any().optional(),
    api_key: Joi.string().required(),
    blog_category_id: Joi.number().optional(),
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

  const { api_key, astrologer_uni_id, blog_title, blog_content, blog_category_id } = value;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  const slug = blog_title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let blogData = {
    auth_id: astrologer_uni_id,
    title: blog_title,
    slug,
    content: blog_content,
    status: 0,
    blog_category_id: blog_category_id || 0,
  };

  if (req.files && req.files.length > 0) {
    const file = req.files.find(f => f.fieldname === 'blog_image');
    if (file) {
      blogData.blog_image = `uploads/blog/${file.filename}`;
    }
  }

  try {
    await Blog.create(blogData);
    return res.json({ status: 1, msg: 'Blog created successfully' });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong. Try again',
      error: err.message,
    });
  }
};

export const getMyBlog = async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    offset: Joi.number().optional().default(0),
    id: Joi.number().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      msg: error.details.map(e => e.message).join('\n')
    });
  }

  const { api_key, astrologer_uni_id, offset } = value;
  const limit = constants.api_page_limit_secondary || 15;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    });
  }

  const blogs = await Blog.findAll({
    where: { auth_id: astrologer_uni_id },
    include: [
      {
        model: Astrologer,
        as: 'astrologer_short',
        attributes: ['id', 'astrologer_uni_id', 'display_name', 'slug', 'astro_img']
      },
      {
        model: User,
        as: 'user_short',
        attributes: ['id', 'user_uni_id', 'name', 'user_fcm_token', 'user_ios_token', 'avg_rating', 'full_info']
      },
      {
        model: BlogCategory,
        as: 'blogcategory_short',
        attributes: ['id', 'slug'],
        required: false
      }
    ],
    offset,
    limit,
    order: [['id', 'DESC']],
    raw: false
  });

  const host = `${req.protocol}://${req.get('host')}`;

  const data = await Promise.all(
    blogs.map(async blog => {
      const blogData = blog.toJSON();

      // Format image URLs
      blogData.blog_image = blogData.blog_image ? `${host}/${blogData.blog_image}` : '';

      if (blogData.astrologer_short?.astro_img) {
        blogData.astrologer_short.astro_img = `${host}/uploads/astrologer/${blogData.astrologer_short.astro_img}`;
      }

      // Add custom fields
      blogData.astro_follow_count = blogData.astrologer_short?.followers?.length || 0;
      blogData.like_count = await BlogLike.count({ where: { blog_id: blogData.id, status: 1 } });
      blogData.is_astro_follow = false;
      blogData.is_likes = false;
      blogData.day = moment(blogData.created_at).fromNow();

      // Rename alias back to expected key
      blogData.blogcategory = blogData.blogcategory_short || null;
      delete blogData.blogcategory_short;

      // Rename other aliases if needed
      blogData.astrologer = blogData.astrologer_short || null;
      delete blogData.astrologer_short;

      blogData.user = blogData.user_short || null;
      delete blogData.user_short;

      return blogData;
    })
  );

  return res.json({
    status: 1,
    msg: 'Result Found',
    offset: offset + limit,
    data
  });
};
