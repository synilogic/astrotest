import { Quote } from '../_models/quote.js';
import { constants } from '../_config/constants.js';
import Joi from 'joi';

export const getQuote = async (req, res) => {
  const requestBody = req.body || {};

  const schema = Joi.object({
    offset: Joi.number().optional().allow('').default(0),
    status: Joi.string().optional().allow(''),
    quote_category_id: Joi.number().optional().allow('')
  });

  const { error, value } = schema.validate(requestBody);

  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(d => d.message).join('\n')
    });
  }

  const offset = value.offset === '' ? 0 : parseInt(value.offset) || 0;
  const limit = constants.api_page_limit || 10;
  const quoteCategoryId = value.quote_category_id === '' ? undefined : parseInt(value.quote_category_id);

  const whereClause = {};
  if (value.status) whereClause.status = value.status;
  if (quoteCategoryId !== undefined) whereClause.quote_category_id = quoteCategoryId;

  try {
    const quotes = await Quote.findAll({
      where: whereClause,
      offset,
      limit,
      order: [['id', 'DESC']]
    });

    const result = quotes.length > 0
      ? {
          status: 1,
          msg: 'Result Found',
          offset: offset + limit,
          data: quotes
        }
      : {
          status: 0,
          msg: 'No Record Found'
        };

    return res.json(result);

  } catch (err) {
    console.error('getQuote Error:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong',
      error: err.message
    });
  }
};
