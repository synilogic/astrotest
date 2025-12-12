import { ServiceAssign } from '../_models/serviceAssign.js';
import Astrologer from '../_models/astrologers.js';
import User from '../_models/users.js';
import { Service } from '../_models/service.js';
import Language from '../_models/languages.js';
import Category from '../_models/categories.js';
import { constants } from '../_config/constants.js';
import moment from 'moment'; 

const {
  astrologer_image_path,
  service_image_path,
  api_page_limit: API_PAGE_LIMIT,
  default_astrologer_image_path
} = constants;


export const serviceAstrologerList = async (req, res) => {
  const data = req.body || req.query || {};
  const { offset = 0, service_id, astrologer_uni_id } = data;
  const limit = API_PAGE_LIMIT;

  try {
    const where = {};
    if (service_id) where.service_id = service_id;
    if (astrologer_uni_id) where.astrologer_uni_id = astrologer_uni_id;

    const records = await ServiceAssign.findAll({
      where,
      include: [
        {
          model: Astrologer,
          as: 'astrologer',
          include: [
            {
              model: Language,
              as: 'languages',
              through: { attributes: [] } // For pivot
            },
            {
              model: Category,
              as: 'categories',
              through: { attributes: [] } // For pivot
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'user_uni_id',
            'name',
            'user_fcm_token',
            'user_ios_token',
            'avg_rating'
          ]
        },
        {
          model: Service,
          as: 'services'
        }
      ],
      offset: Number(offset),
      limit: Number(limit),
      order: [['id', 'DESC']]
    });

    if (!records || records.length === 0) {
      return res.json({ status: 0, msg: 'No Record Found' });
    }

    const responseData = records.map(item => {
      const astrologer = item.astrologer || {};
      const user = item.user || {};
      const service = item.services || {};

      // Format languages with pivot
      const formattedLanguages = (astrologer.languages || []).map(lang => ({
        id: lang.id,
        language_name: lang.language_name,
        pivot: {
          astrologer_id: astrologer.id,
          language_id: lang.id
        }
      }));

      // Format categories with pivot
      const formattedCategories = (astrologer.categories || []).map(cat => ({
        id: cat.id,
        category_title: cat.category_title,
        category_slug: cat.category_slug,
        category_images: `${req.protocol}://${req.get('host')}/uploads/category/${cat.category_images}`,
        pivot: {
          astrologer_id: astrologer.id,
          category_id: cat.id
        }
      }));

      return {
        id: item.id,
        service_id: item.service_id,
        astrologer_uni_id: item.astrologer_uni_id,
        price: item.price,
        actual_price: item.actual_price,
        description: item.description,
        duration: item.duration,
        status: item.status,
        created_at: moment(item.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: moment(item.updated_at).format('YYYY-MM-DD HH:mm:ss'),

        astrologer: {
          id: astrologer.id,
          astrologer_uni_id: astrologer.astrologer_uni_id,
          display_name: astrologer.display_name,
          slug: astrologer.slug,
          astro_img: astrologer.astro_img
            ? `${req.protocol}://${req.get('host')}/${astrologer_image_path}${astrologer.astro_img}`
            : `${req.protocol}://${req.get('host')}/${default_astrologer_image_path}`,
          experience: astrologer.experience,
          languages_list: (astrologer.languages || [])
            .map(l => l.language_name)
            .join(', '),
          categories_list: (astrologer.categories || [])
            .map(c => c.category_title)
            .join(', '),
          languages: formattedLanguages,
          categories: formattedCategories
        },

        user: {
          id: user.id,
          user_uni_id: user.user_uni_id,
          name: user.name,
          user_fcm_token: user.user_fcm_token,
          user_ios_token: user.user_ios_token || null,
          avg_rating: user.avg_rating || '0.0',
          full_info: `${user.name} () {} [${user.user_uni_id}] [InActive]`
        },

        service: {
          id: service.id,
          service_category_id: service.service_category_id,
          service_name: service.service_name,
          slug: service.slug,
          service_image: service.service_image
            ? `${req.protocol}://${req.get('host')}/${service_image_path}${service.service_image}`
            : '',
          service_description: service.service_description
        }
      };
    });

    return res.json({
      status: 1,
      offset: Number(offset) + Number(limit),
      data: responseData, 
      msg: 'ServiceAssign List'
    });
  } catch (error) {
    return res.status(500).json({
      status: 0,
      msg: 'No Record Found',
      error: error.message
    });
  }
};
