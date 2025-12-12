// routes/banner.routes.js
import express from 'express';
import dotenv from 'dotenv';
import Joi from "joi";
import path from 'path';
import fs from 'fs';
import db from "../_config/db.js";
import "../_models/index.js";
import Banner from '../_models/banners.js';
import BannerCategory from "../_models/banner_categories.js";
import {UploadImage} from "../_helpers/common.js";
import multer from "multer";

dotenv.config();
const upload = multer({ dest: 'temp/' });
const router = express.Router();
// POST /api/banners
// POST /api/banners/create
router.post('/create', upload.single('banner_image'), async (req, res) => {
  try {
    // Validate input
    const schema = Joi.object({
      banner_category_id: Joi.number().integer().required(),
      title: Joi.string().required(),
      subject: Joi.string().required(),
      url: Joi.string().uri().optional(),
      status: Joi.string().valid('0', '1').optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { banner_category_id, title, subject, url, status } = value;

    // Ensure image file is provided
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: 'Banner image file is required' });
    }

    // Destination: /public/uploads/banner
    const bannerUploadDir = path.join(process.cwd(), 'public', 'uploads', 'banner');
    fs.mkdirSync(bannerUploadDir, { recursive: true });

    const finalFilename = `${Date.now()}-${req.file.originalname}`;
    const finalPath = path.join(bannerUploadDir, finalFilename);

    // Move file from temp to final path
    fs.renameSync(req.file.path, finalPath);

    // Validate category
    const category = await BannerCategory.findByPk(banner_category_id);
    if (!category) { 
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Save to DB
    const banner = await Banner.create({
      banner_category_id,
      title,
      subject,
      banner_image: finalFilename,
      url,
      status: status || '1'
    });

    // Get banner with category info
    const newBanner = await Banner.findByPk(banner.id, {
      include: [{
        model: BannerCategory,
        as: 'category',
        attributes: ['id', 'title']
      }]
    });

    return res.status(201).json({ success: 1, data: newBanner });

  } catch (error) {
    console.error('Error creating banner:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});



router.post('/createcategory', async (req, res) => {
  try {
    // Define Joi schema
    const schema = Joi.object({
      title: Joi.string().required().messages({
        'any.required': 'Category title is required',
        'string.empty': 'Category title cannot be empty'
      }),
      status: Joi.string().valid('0', '1').optional()
    });

    // Validate request body
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { title, status } = value;

    // Create the new category
    const category = await BannerCategory.create({
      title,
      status: status || '1', // Default to '1'
      created_at: new Date(),
      updated_at: new Date()
    });

    return res.status(201).json({
      success: 1,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;