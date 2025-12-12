// routes/banner.routes.js
import express from 'express';
import Joi from 'joi';
import { Op } from 'sequelize';
import Banner from '../_models/banners.js';
import BannerCategory from '../_models/banner_categories.js';
import "../_models/index.js";
import fs from 'fs';
import path from 'path';
import multer from "multer";
const router = express.Router();
const upload = multer();
// GET /api/banners
// router.get('/bannerlist', async (req, res) => {
//   try {
//     // Fetch all banners with their associated banner category
//     const banners = await Banner.findAll({
//       include: [
//         {
//           model: BannerCategory,
//           as: 'category',  // Make sure this matches the 'as' in the association
//           attributes: ['id','title']  // Adjust the attributes you want to retrieve
//         }
//       ]
//     });
//             console.log( "banners all",banners);
//     return res.status(200).json({ status: 1, data: banners });
//   } catch (error) {
//     console.error('Error fetching banners:', error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

router.get('/bannerlist', upload.any(),async (req, res) => {
  try {
    const filterSchema = Joi.object({
      status: Joi.string().valid('0', '1').optional(),
      banner_category_id: Joi.number().integer().optional(),
      keyword: Joi.string().allow('', null).optional(),
    });

    const { error, value } = filterSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { status, banner_category_id, keyword } = value;
    const whereClause = {};
    const hasFilters = status !== undefined || banner_category_id !== undefined || (keyword && keyword.trim() !== '');

    if (hasFilters) {
      if (status !== undefined) {
        whereClause.status = status;
      }

      if (banner_category_id !== undefined) {
        whereClause.banner_category_id = banner_category_id;
      }

      if (keyword) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${keyword}%` } },
          { subject: { [Op.like]: `%${keyword}%` } },
        ];
      }
    }

  const BASE_URL = `${req.protocol}://${req.get('host')}`;
 const defaultBannerImage = "https://karmleela.com/assets/img/customer.png";
    const bannersRaw = await Banner.findAll({
      where: hasFilters ? whereClause : {},
      include: [
        {
          model: BannerCategory,
          as: 'category',
          attributes: ['id', 'title'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

   const banners = bannersRaw.map(banner => {
  const b = banner.toJSON();
   const imagePath = path.join(process.cwd(), 'public', 'uploads', 'customers', b.banner_image || '');
      const imageExists = b.banner_image && fs.existsSync(imagePath);
   b.banner_image_url = imageExists
        ? `${BASE_URL}/uploads/customers/${b.banner_image}`
        : defaultBannerImage;

      return b;
});

    return res.status(200).json({
      status: 1,
      data: banners,
    });
  } catch (error) {
    console.error('Error filtering banners:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});


export default router;
