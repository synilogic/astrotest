// import Joi from 'joi';
// import { Op } from 'sequelize';
// import { saveApiLogs } from '../_helpers/helper.js';
// import { checkUserApiKey } from '../_helpers/common.js';
// import { Sanjeevini } from '../_models/Sanjeevini.js';
// import { SanjeeviniOrder } from '../_models/SanjeeviniOrder.js';
// // import { IMAGE_BASE_URL_SANJEEVINI, default_sanjeevini_image } from '../_config/constants.js';

// export const sanjeeviniList = async (req, res) => {
//   await saveApiLogs(req);

//   const schema = Joi.object({
//     api_key: Joi.string().optional().allow(null, ''),
//     user_uni_id: Joi.string().optional().allow(null, ''),
//     search: Joi.string().optional().allow(null, ''),
//     offset: Joi.number().optional().default(0)
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     return res.status(400).json({
//       status: 0,
//       errors: error.details,
//       message: 'Something went wrong',
//       msg: error.details.map(e => e.message).join('\n')
//     });
//   }

//   const { api_key, user_uni_id, search, offset } = value;
//   const limit = parseInt(process.env.API_PAGE_LIMIT || 10);

//   // Validate API Key
//   if ((api_key || user_uni_id) && !(await checkUserApiKey(api_key, user_uni_id))) {
//     return res.json({
//       status: 0,
//       error_code: 101,
//       msg: 'Unauthorized User... Please login again'
//     });
//   }

//   try {
//     const where = { status: '1' };
//     if (search) {
//       where.title = { [Op.like]: `%${search}%` };
//     }

//     const data = await Sanjeevini.findAll({
//       where,
//       order: [['title', 'ASC']],
//       offset,
//       limit
//     });

//     const enrichedData = await Promise.all(
//       data.map(async (item) => {
//         let payment_status = 0;

//         const paid = await SanjeeviniOrder.findOne({
//           where: {
//             sanjeevini_id: item.id,
//             user_uni_id,
//             status: 1
//           }
//         });

//         // if (paid) {
//         //   payment_status = 1;
//         // } else {
//         //   item.sanjeevini_image = `${IMAGE_BASE_URL_SANJEEVINI}/${default_sanjeevini_image}`;
//         // }

//         return {
//           ...item.toJSON(),
//           payment_status
//         };
//       })
//     );

//     if (enrichedData.length > 0) {
//       return res.json({
//         status: 1,
//         offset: offset + limit,
//         data: enrichedData,
//         msg: 'Get successfully'
//       });
//     } else {
//       return res.json({
//         status: 0,
//         data: '',
//         msg: 'No data found'
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       status: 0,
//       msg: 'Internal Server Error'
//     });
//   }
// };


import Joi from 'joi';
import { Op } from 'sequelize';
import { saveApiLogs } from '../_helpers/helper.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { Sanjeevini } from '../_models/Sanjeevini.js';
import { SanjeeviniOrder } from '../_models/SanjeeviniOrder.js';

const IMAGE_BASE_URL_SANJEEVINI = process.env.IMAGE_BASE_URL_SANJEEVINI || 'https://localhost:8008/';
const DEFAULT_SANJEEVINI_IMAGE = process.env.DEFAULT_SANJEEVINI_IMAGE || 'assets/img/banner.jpg';

export const sanjeeviniList = async (req, res) => {
  await saveApiLogs(req);

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

  const { api_key, user_uni_id, search, offset } = value;
  const limit = parseInt(process.env.API_PAGE_LIMIT || 10);

  // Validate API Key
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

        if (paid) {
          payment_status = 1;
        }

        const imagePath = item.sanjeevini_image
          ? `${IMAGE_BASE_URL_SANJEEVINI}${item.sanjeevini_image}`
          : `${IMAGE_BASE_URL_SANJEEVINI}${DEFAULT_SANJEEVINI_IMAGE}`;

        return {
          ...item.toJSON(),
          sanjeevini_image: imagePath,
          payment_status
        };
      })
    );

    if (enrichedData.length > 0) {
      return res.json({
        status: 1,
        offset: offset + limit,
        data: enrichedData,
        msg: 'Get successfully'
      });
    } else {
      return res.json({
        status: 0,
        data: '',
        msg: 'No data found'
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 0,
      msg: 'Internal Server Error'
    });
  }
};
