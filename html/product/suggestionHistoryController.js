import { Op, literal } from 'sequelize';
import ChatChannelHistory from '../_models/chatChannelHistoryModel.js';
import User from '../_models/users.js';
import Customer from '../_models/customers.js';
import Astrologer from '../_models/astrologers.js';
import { checkUserApiKey } from '../_helpers/common.js';
import {
  IMAGE_BASE_URL_CUSTOMER, IMAGE_BASE_URL_ASTROLOGER,
  DEFAULT_CUSTOMER_IMAGE, DEFAULT_ASTROLOGER_IMAGE,
  api_page_limit_secondary,
} from '../_config/constants.js';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const getSuggestionHistoryController = async (req, res) => {
  try {
    const { api_key, user_uni_id, channel_name, astrologer_uni_id, insert_demo = false } = req.body;
    const offset = parseInt(req.body.offset) || 0;

    if (!api_key || !user_uni_id) {
      return res.status(400).json({
        status: 0,
        msg: 'api_key and user_uni_id are required.',
        errors: { api_key: 'Required', user_uni_id: 'Required' }
      });
    }

    const isValidUser = await checkUserApiKey(api_key, user_uni_id);
    if (!isValidUser) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    // ✅ OPTIONAL: insert dummy message with IST timestamps
    if (insert_demo === true) {
      const nowIST = dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

      await ChatChannelHistory.create({
        user_uni_id,
        channel_name: 'CHAT/CUS0007-ASTRO0026',
        message: JSON.stringify({
          name: "Rudraksha",
          productUrl: "https://astro.synilogictech.com/products/rudraksha/ASTRO0026"
        }),
        message_type: 'Product',
        call_type: 'chat',
        status: 1,
        trash: 0,
        created_at: nowIST,
        updated_at: nowIST
      });
    }

    const limit = api_page_limit_secondary || 15;

    const whereClause = {
      message_type: ['Product', 'ManualServices', 'Service'],
      [Op.and]: [],
    };

    if (channel_name) {
      whereClause.channel_name = channel_name;
    }

    if (user_uni_id?.includes('CUS')) {
      whereClause[Op.and].push(
        literal(`SUBSTRING_INDEX(SUBSTRING_INDEX(channel_name, '/', -1), '-', 1) = '${user_uni_id}'`),
        { trash: 0 }
      );
    } else if (user_uni_id?.includes('ASTRO')) {
      whereClause[Op.and].push(
        literal(`SUBSTRING_INDEX(channel_name, '-', -1) = '${user_uni_id}'`)
      );
    }

    if (astrologer_uni_id?.includes('ASTRO')) {
      whereClause[Op.and].push(
        literal(`SUBSTRING_INDEX(channel_name, '-', -1) = '${astrologer_uni_id}'`)
      );
    }

    const data = await ChatChannelHistory.findAll({
      where: whereClause,
      attributes: {
        include: [
          [literal(`IF(ChatChannelHistory.user_uni_id LIKE '%ASTRO%', chat_astrologer.display_name, chat_user.name)`), 'user_name'],
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: [],
        },
        {
          model: Astrologer,
          as: 'astrologer',
          attributes: ['astro_img', 'display_name'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['customer_img'],
        },
      ],
      offset,
      limit,
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });

    const chatData = data.map((row) => {
      const isAstro = row.user_uni_id?.includes('ASTRO');

      const customerImgPath = row.chat_customer?.customer_img
        ? `${IMAGE_BASE_URL_CUSTOMER}${row.chat_customer.customer_img}`
        : DEFAULT_CUSTOMER_IMAGE;

      const astroImgPath = row.chat_astrologer?.astro_img
        ? `${IMAGE_BASE_URL_ASTROLOGER}${row.chat_astrologer.astro_img}`
        : DEFAULT_ASTROLOGER_IMAGE;

      return {
        ...row,
        user_name: row.user_name || '',
        user_image_url: isAstro ? astroImgPath : customerImgPath,
        parent_id: row.parent_id || '',
        selected_text: row.selected_text || '',
        created_at: row.created_at
          ? dayjs.utc(row.created_at).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
          : null,
        updated_at: row.updated_at
          ? dayjs.utc(row.updated_at).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
          : null,
      };
    });

    const result = chatData.length > 0
      ? {
          status: 1,
          msg: 'Get Successfully.',
          offset: offset + limit,
          data: chatData
        }
      : {
          status: 0,
          msg: 'No Record Found',
          data: []
        };

    return res.json(result);
  } catch (error) {
    console.error('Error in getSuggestionHistoryController:', error);
    return res.status(500).json({ status: 0, msg: 'Internal Server Error' });
  }
};
