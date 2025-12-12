import Joi from 'joi';
import { Op } from 'sequelize';
import SwitchWord from '../_models/switchword.js';
import { SwitchWordOrder } from '../_models/switchwordOrder.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { api_page_limit_secondary, DEFAULT_SWITCHWORD_IMAGE_PATH } from '../_config/constants.js';

export const switchwordListController = async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().optional().allow(''),
    user_uni_id: Joi.string().optional().allow(''),
    search: Joi.string().optional().allow(''),
    offset: Joi.number().optional(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Validation failed',
      msg: error.details.map((err) => err.message).join('\n'),
    });
  }

  const { api_key, user_uni_id, search } = value;
  const offset = value.offset || 0;
  const limit = api_page_limit_secondary;

  if ((api_key || user_uni_id) && !(await checkUserApiKey(api_key, user_uni_id))) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    const whereClause = { status: 1 };
    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    const switchwords = await SwitchWord.findAll({
      where: whereClause,
      order: [['title', 'ASC']],
      offset,
      limit,
    });

    const result = await Promise.all(
      switchwords.map(async (item) => {
        let payment_status = 0;

        const orderCheck = await SwitchWordOrder.findOne({
          where: {
            switchword_id: item.id,
            user_uni_id,
            status: 1,
          },
        });

        if (!orderCheck) {
          payment_status = 0;
        } else {
          payment_status = 1;
        }

        const imagePath = payment_status === 1
          ? `${req.protocol}://${req.get('host')}/uploads/switchword/${item.switchword_image}`
          : DEFAULT_SWITCHWORD_IMAGE_PATH;

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          switchword_image: imagePath,
          slug: item.slug,
          meta_title: item.meta_title,
          meta_key: item.meta_key,
          meta_description: item.meta_description,
          price: item.price,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          payment_status,
        };
      })
    );

    return res.json({
      status: 1,
      offset: offset + limit,
      data: result,
      msg: 'Get successfully',
    });
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: 'Server error',
      error: err.message,
    });
  }
};
