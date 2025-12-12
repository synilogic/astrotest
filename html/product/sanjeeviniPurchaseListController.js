import Joi from 'joi';
import path from 'path';
import fs from 'fs';
import moment from 'moment';
import { SanjeeviniOrder } from '../_models/SanjeeviniOrder.js';
import { Sanjeevini } from '../_models/Sanjeevini.js';
import { checkUserApiKey } from '../_helpers/common.js';
import {
  SANJEEVINI_IMAGE_PATH,
  DEFAULT_SANJEEVINI_IMAGE_PATH,
  api_page_limit_secondary,
  constants
} from '../_config/constants.js';
import { formatDateTime } from "../_helpers/dateTimeFormat.js";

export const sanjeeviniPurchaseList = async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().optional().allow('', null),
    user_uni_id: Joi.string().optional().allow('', null),
    offset: Joi.number().optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(err => err.message).join('\n'),
    });
  }

  const { api_key, user_uni_id, offset = 0 } = value;
  const limit = api_page_limit_secondary;

  // ✅ Get dynamic host URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  if ((api_key || user_uni_id) && !(await checkUserApiKey(api_key, user_uni_id))) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    const orders = await SanjeeviniOrder.findAll({
      where: {
        user_uni_id,
        status: 1
      },
      include: [
        {
          model: Sanjeevini,
          as: 'sanjeevini',
          attributes: ['title', 'description', 'sanjeevini_image']
        }
      ],
      offset,
      limit,
      order: [['id', 'DESC']]
    });

    const formatted = orders.map(order => {
      const item = order.toJSON();
      const sanjeeviniData = item.sanjeevini || {};
      const image = sanjeeviniData.sanjeevini_image || '';
      const imageFullPath = path.join('public', SANJEEVINI_IMAGE_PATH, image);

      item.title = sanjeeviniData.title || '';
      item.description = sanjeeviniData.description || '';
      item.sanjeevini_image =
        image && fs.existsSync(imageFullPath)
          ? `${baseUrl}/uploads/sanjeevini/${image}`
          : `${baseUrl}/${DEFAULT_SANJEEVINI_IMAGE_PATH}`;

      // ✅ Format timestamps like Laravel
      item.created_at = formatDateTime(item.created_at),
      item.updated_at = formatDateTime(item.updated_at),

      delete item.sanjeevini;
      return item;
    });

    if (formatted.length > 0) {
      return res.json({
        status: 1,
        offset: offset + limit,
        data: formatted,
        msg: 'Get successfully',
      });
    } else {
      return res.json({
        status: 0,
        data: '',
        msg: 'No data found',
      });
    }
  } catch (err) {
    console.error('Error:', err);
    return res.json({
      status: 0,
      msg: 'Something went wrong',
      error: err.message,
    });
  }
};
