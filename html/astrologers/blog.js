import express from "express";
import multer from "multer";
import Joi from "joi";
import path from "path";
import fs from "fs";
import { checkUserApiKey } from "../_helpers/common.js";
import Blog from "../_models/blog.js";
import { getAllBlog } from "../_helpers/blogService.js";
import { getConfig } from "../configStore.js";

import { v4 as uuidv4 } from "uuid";

const router = express.Router();

function generateSlug(title) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumerics with hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens
  const uniqueSuffix = Date.now(); // or use UUID if you want
  return `${baseSlug}-${uniqueSuffix}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const dir = path.join('public', 'uploads/blog/');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    try {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-blog_image${ext}`;
      cb(null, filename);
    } catch (err) {
      cb(err);
    }
  }
});

const upload = multer({ storage: storage });

router.post("/addBlog", upload.single("blog_image"), async (req, res) => {
  // Validation schema
  const schema = Joi.object({
    astrologer_uni_id: Joi.string().required(),
    blog_title: Joi.string().required(),
    blog_content: Joi.string().required(),
    api_key: Joi.string().required(),
    blog_category_id: Joi.string().allow('', null),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      message: "Validation failed",
      errors: error.details,
      msg: error.details.map((e) => e.message).join("\n"),
    });
  }

  const { astrologer_uni_id, blog_title, blog_content, api_key, blog_category_id } = attributes;

  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: "Unauthorized User... Please login again",
    });
  }

  // Prepare data
  const blogData = {
    auth_id: astrologer_uni_id,
    title: blog_title,
    content: blog_content,
    status: 0,
    blog_category_id: blog_category_id || "0",
    slug: generateSlug(blog_title)
  };

  // If file was uploaded
  if (req.file) {
    blogData.blog_image = req.file.filename;
  }

  try {
    const blog = await Blog.create(blogData);

    if (blog) {
      return res.json({
        status: 1,
        msg: "blog are Success",
      });
    } else {
      return res.json({
        status: 0,
        msg: "Something went wrong.. Try again",
      });
    }
  } catch (err) {
    console.error("Error creating blog:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      error: err.message,
    });
  }
});

// Converted getMyBlog route
router.post("/getMyBlog", upload.none(), async (req, res) => {
  // Validation schema
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional().default(0),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n'),
    });
  }

  const { api_key, astrologer_uni_id, offset } = attributes;

  // Check authorization
  const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
  if (!isAuthorized) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    const currentOffset = offset || 0;
    const limit = 6; // You can get this from config like in Laravel
    
    // Prepare filter object
    const filter = {
      astrologer_uni_id: astrologer_uni_id,
      limit: limit,
      offset: currentOffset
    };



    const blogs = await getAllBlog(filter, req);


    if (blogs && blogs.length > 0) {
      const result = {
        status: 1,
        msg: 'Result Found',
        offset: currentOffset + limit,
        data: blogs,
      };
      return res.json(result);
    } else {
      const result = {
        status: 0,
        msg: "NO record",
      };
      return res.json(result);
    }
  } catch (err) {
    console.error("Error fetching blogs:", err);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong",
      error: err.message,
    });
  }
});

router.post("/deleteBlog", upload.none(), async (req, res) => {
  // Validation schema
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    id: Joi.number().integer().required(),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((e) => e.message).join('\n'),
    });
  }

  const { api_key, astrologer_uni_id: user_uni_id, id } = attributes;

  // Check authorization
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    // Find the blog that belongs to the astrologer
    const blog = await Blog.findOne({
      where: {
        auth_id: user_uni_id,
        id: id
      }
    });

    if (blog) {
      // Delete the blog
      await Blog.destroy({
        where: {
          id: id
        }
      });

      const result = {
        status: 1,
        msg: "Blog deleted successfully",
      };
      return res.json(result);
    } else {
      const result = {
        status: 0,
        msg: "No Record Found",
      };
      return res.json(result);
    }
  } catch (err) {
    console.error("Error deleting blog:", err);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong",
      error: err.message,
    });
  }
});

export default router;