import Joi from 'joi';
import { Op } from 'sequelize';
import Offer from '../_models/offers.js';
// import { saveApiLogs, updateApiLogs } from '../_helpers/helper.js';
// import { API_PAGE_LIMIT_SECONDARY } from '../_config/constants.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { api_page_limit_secondary } from '../_config/constants.js';



export const offerList = async (req, res) => {
  // const api = await saveApiLogs(req);

  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().optional().default(0),
    offer_type: Joi.string().valid('old').optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const result = {
      status: 0,
      errors: error.details,
      msg: 'Validation failed',
    };
    // await updateApiLogs(api, result);
    return res.status(400).json(result);
  }

  const { api_key, user_uni_id, offset, offer_type } = value;

  // Check API key
  const isValid = await checkUserApiKey(api_key, user_uni_id);
  if (!isValid) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.status(401).json(result);
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const limit = api_page_limit_secondary || 15;

  let whereCondition = { status: 1 };

  if (offer_type === 'old') {
    whereCondition.offer_validity_to = { [Op.lt]: currentDate };
  } else {
    whereCondition = {
      ...whereCondition,
      offer_validity_from: { [Op.lte]: currentDate },
      offer_validity_to: { [Op.gte]: currentDate }
    };
  }

  try {
    const offers = await Offer.findAll({
      where: whereCondition,
      order: [['id', 'DESC']],
      offset,
      limit,
    });

    const result = offers.length
      ? {
          status: 1,
          offset: offset + limit,
          data: offers,
          msg: 'Get successfully',
        }
      : {
          status: 0,
          msg: 'No data found',
        };

    // await updateApiLogs(api, result);
    return res.json(result);
  } catch (err) {
    console.error('Error fetching offer list:', err);
    const result = {
      status: 0,
      msg: 'Internal Server Error',
    };
    // await updateApiLogs(api, result);
    return res.status(500).json(result);
  }
};
