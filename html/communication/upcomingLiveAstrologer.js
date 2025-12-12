import express from 'express';
import dotenv from 'dotenv';
import Joi from 'joi';
import { Op, literal } from 'sequelize';
import dayjs from 'dayjs';
import multer from 'multer';

import LiveSchedule from '../_models/live_schedules.js';
import Astrologer from '../_models/astrologers.js';
import { constants } from '../_config/constants.js';

dotenv.config();
const router = express.Router();
const upload = multer();

router.post('/upcomingLiveAstrologer', upload.none(), async (req, res) => {
  try {
    const body = req.body || {};

    const schema = Joi.object({
      offset: Joi.number().integer().min(0).optional(),
      user_uni_id: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(body);
    if (error) {
      return res.status(400).json({
        status: 0,
        errors: error.details,
        message: 'Something went wrong',
        msg: error.details.map(err => err.message).join('\n'),
      });
    }

    const offset = parseInt(body.offset) || 0;
    const pageLimit = constants.api_page_limit || 10;

    const records = await LiveSchedule.findAll({
      where: {
        status: 1,
        schedule_type: 'live',
        [Op.and]: [
          literal(`CONCAT(date, ' ', time) > '${dayjs().format('YYYY-MM-DD HH:mm:ss')}'`)
        ]
      },
      include: [
        {
          model: Astrologer,
          as: 'astrologer',
          attributes: ['id', 'astrologer_uni_id', 'display_name', 'slug', 'astro_img']
        }
      ],
      offset,
      limit: pageLimit,
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    const hostUrl = `${req.protocol}://${req.get("host")}/`;

    const formatted = records.map(record => {
      const astrologer = record.astrologer || {};
      return {
        id: record.id,
        astrologer_uni_id: record.astrologer_uni_id,
        schedule_type: record.schedule_type,
        date: record.date,
        time: record.time,
        topic: record.topic,
        status: record.status,
        created_at: dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs(record.updated_at).format('YYYY-MM-DD HH:mm:ss'),
        astrologer: {
          id: astrologer.id,
          astrologer_uni_id: astrologer.astrologer_uni_id,
          display_name: astrologer.display_name,
          slug: astrologer.slug,
          astro_img: astrologer.astro_img
            ? `${hostUrl}${constants.astrologer_image_path}${astrologer.astro_img}`
            : ''
        }
      };
    });

  
      return res.status(200).json({
        status: 1,
        msg: 'Upcoming Live Astrologer List',
        offset: offset + pageLimit,
        data: formatted
      });


  } catch (err) {
    console.error('Error in upcomingLiveAstrologer:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong.. Try Again',
    });
  }
});

export default router;
