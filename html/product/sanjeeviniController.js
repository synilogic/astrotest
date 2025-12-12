import Joi from 'joi';
import { Op } from 'sequelize';
import moment from 'moment';
// import { saveApiLogs } from '../_helpers/helper.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { Sanjeevini } from '../_models/Sanjeevini.js';
import { SanjeeviniOrder } from '../_models/SanjeeviniOrder.js';
import { constants } from '../_config/constants.js';

const DEFAULT_SANJEEVINI_IMAGE = 'assets/img/banner.jpg';

export const sanjeeviniList = async (req, res) => {
  // await saveApiLogs(req);

  const schema = Joi.object({
    api_key: Joi.string().optional().allow(null, ''),
    user_uni_id: Joi.string().optional().allow(null, ''),
    search: Joi.string().optional().allow(null, ''),
    offset: Joi.number().optional().default(0)
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(e => e.message).join('\n')
    });
  }

  const { api_key, user_uni_id, search, offset = 0 } = value;
  const limit = constants.api_page_limit;

  // Check API key
  if ((api_key || user_uni_id) && !(await checkUserApiKey(api_key, user_uni_id))) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again'
    });
  }

  try {
    const where = { status: '1' };
    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }

    const data = await Sanjeevini.findAll({
      where,
      order: [['title', 'ASC']],
      offset,
      limit
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const enrichedData = await Promise.all(
      data.map(async (item) => {
        let payment_status = 0;

        const paid = await SanjeeviniOrder.findOne({
          where: {
            sanjeevini_id: item.id,
            user_uni_id,
            status: 1
          }
        });

        if (paid) payment_status = 1;

        const imagePath = item.sanjeevini_image
          ? `${baseUrl}/uploads/sanjeevini/${item.sanjeevini_image}`
          : `${baseUrl}/${DEFAULT_SANJEEVINI_IMAGE}`;

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          sanjeevini_image: imagePath,
          slug: item.slug,
          meta_title: item.meta_title,
          meta_key: item.meta_key,
          meta_description: item.meta_description,
          price: item.price,
          status: item.status,
          created_at: moment(item.created_at).format('YYYY-MM-DD HH:mm:ss'),
          updated_at: moment(item.updated_at).format('YYYY-MM-DD HH:mm:ss'),
          payment_status
        };
      })
    );

    return res.json({
      status: 1,
      offset: offset + limit,
      data: enrichedData,
      msg: 'Get successfully'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 0,
      msg: 'Internal Server Error',
      error: err.message
    });
  }
};
