
import { SwitchWordOrder } from '../_models/switchwordOrder.js';
import SwitchWord from '../_models/switchword.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';
import path from 'path';
import fs from 'fs';
import { formatDateTime } from "../_helpers/dateTimeFormat.js";

export const switchwordPurchaseList = async (req, res) => {
  try {
    const { api_key = '', user_uni_id = '', offset = 0 } = req.body;

    // Check user API key
    if ((api_key && user_uni_id) && !(await checkUserApiKey(api_key, user_uni_id))) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const page_limit = constants.api_page_limit_secondary || 10;

    // Fetch orders with associated SwitchWord
    const orders = await SwitchWordOrder.findAll({
      where: {
        user_uni_id,
        status: 1,
      },
      include: [
        {
          model: SwitchWord,
          attributes: ['title', 'description', 'switchword_image'],
        }
      ],
      offset: parseInt(offset),
      limit: page_limit,
      raw: true,
      nest: true,
    });

    // Define paths
    const baseImagePath = path.join(process.cwd(), 'public', constants.switchword_image_path || 'uploads/switchword/');
    const baseImageUrl = constants.IMAGE_BASE_URL_SWITCHWORD || 'https://astro.synilogictech.com/uploads/switchword/';
    const defaultImage = constants.DEFAULT_SWITCHWORD_IMAGE || 'assets/img/default_switchword.png';

    // Modify and flatten response
    const updatedOrders = orders.map(order => {
      const { SwitchWord, ...rest } = order;
      const imageFile = SwitchWord?.switchword_image || '';
      const imageExists = imageFile && fs.existsSync(path.join(baseImagePath, imageFile));

      return {
        ...rest,
        title: SwitchWord?.title || '',
        description: SwitchWord?.description || '',
        switchword_image: imageExists
          ? baseImageUrl + imageFile
          : constants.DEFAULT_SWITCHWORD_IMAGE_PATH
            ? constants.DEFAULT_SWITCHWORD_IMAGE_PATH
            : baseImageUrl + defaultImage,
            created_at:formatDateTime(SwitchWord.created_at),
            updated_at:formatDateTime(SwitchWord.updated_at),

      };
    });

    // Send response
    if (updatedOrders.length > 0) {
      return res.json({
        status: 1,
        offset: parseInt(offset) + page_limit,
        data: updatedOrders,
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
    console.error('Error in switchwordPurchaseList:', err);
    return res.status(500).json({
      status: 0,
      message: 'Server error',
      error: err.message,
    });
  }
};
