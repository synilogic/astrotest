import Notice from '../_models/notices.js';
import moment from 'moment';
import { constants } from '../_config/constants.js';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
export const getNotice = async (req, res) => {
  try {
    const record = await Notice.findOne({
      where: { id: 2 },
      raw: true
    });

    if (record) {
      // ✅ Declare domain only once
      const domain = `${req.protocol}://${req.get('host')}`;

      const imageFile = record.notice_image?.trim() || '';
      const imageUrl = imageFile
        ? `${domain}${constants.IMAGE_BASE_URL_NOTICE}/${imageFile}`
        : `${domain}${constants.IMAGE_BASE_URL_NOTICE}/default.jpg`;

      const data = {
        id: record.id,
        title: record.title,
        type: record.type,
        description: record.description || '',
        notice_image: imageUrl,
        notice_link: record.notice_link || `${domain}/wallet`,
        notice_for: record.notice_for,
        
        status: record.status,
        created_at: moment(record.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: moment(record.updated_at).format('YYYY-MM-DD HH:mm:ss')
      };

      return res.json({
        status: 1,
        data,
        msg: 'notice list'
      });
    }

    return res.json({
      status: 0,
      msg: 'No notice found'
    });

  } catch (error) {
    console.error('Error in getNotice:', error);
    return res.status(500).json({ status: 0, msg: 'Server error' });
  }
};
