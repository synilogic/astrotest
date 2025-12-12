import Reviews from '../_models/reviews.js';
import User from '../_models/users.js';
import Customer from '../_models/customers.js';
import Astrologer from '../_models/astrologers.js';
import { constants } from '../_config/constants.js';

export const getReviews = async (req, res) => {
  try {
    const body = req.body || {};
    const rawOffset = body.offset;
    const offset = Number.isInteger(rawOffset) ? rawOffset : parseInt(rawOffset) || 0;
    const limit = 15;

    const whereCondition = {};
    if (typeof req.body.status !== 'undefined') {
   whereCondition.status = Number(req.body.status) === 1 ? 1 : 0;
}

    // Optional filters
    if (body.astrologer_uni_id) {
      whereCondition.review_for_id = body.astrologer_uni_id;
    }

    if (body.user_uni_id) {
      whereCondition.review_by_id = body.user_uni_id;
    }

    // Fetch reviews with associations
    const reviews = await Reviews.findAll({
      where: whereCondition,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        {
          model: User,
          as: 'review_by_user',
          attributes: ['id', 'user_uni_id', 'name', 'email', 'phone', 'avg_rating']
        },
        {
          model: Customer,
          as: 'review_by_customer',
          attributes: ['id', 'customer_uni_id', 'customer_img']
        },
        {
          model: Astrologer,
          as: 'astrologer',
          attributes: ['astrologer_uni_id']
        }
      ]
    });

    // Format the reviews
    const formattedReviews = reviews.map((review) => {
      const customer = review.review_by_customer || {};
      const user = review.review_by_user || {};
      const image = customer.customer_img
        ? `${req.protocol}://${req.get("host")}/${constants.customer_image_path}${customer.customer_img}`
        : `${req.protocol}://${req.get("host")}/${constants.default_customer_image_path}`;

      return {
        id: review.id,
        review_by_id: review.review_by_id,
        review_for_id: review.review_for_id,
        review_rating: review.review_rating,
        review_comment: review.review_comment,
        review_type: review.review_type,
        uniqeid: review.uniqeid,
        parent_id: review.parent_id || 0,
        status: review.status,
        created_at: review.created_at,
        updated_at: review.updated_at,
        customer: customer.id ? {
          id: customer.id,
          customer_uni_id: customer.customer_uni_id,
          customer_img: image
        } : null,
        review_by_user: user.id ? {
          id: user.id,
          user_uni_id: user.user_uni_id,
          name: user.name,
          avg_rating: user.avg_rating || '0.0',
          full_info: `${user.name || ''} (${user.email || ''}) {${user.phone || ''}} [${user.user_uni_id || ''}]`
        } : null
      };
    });

    // Return Data Not Found if reviews array is empty
    if (formattedReviews.length === 0) {
      return res.status(200).json({
        status: 0,
        msg: 'Data Not Found !!'
      });
    }

    // Count ratings (1–5 stars) with same filters
    const ratingCounts = await Promise.all([1, 2, 3, 4, 5].map(async (star) => {
      const count = await Reviews.count({
        where: { ...whereCondition, review_rating: star }
      });
      return { [`${star}_star_count`]: count };
    }));

    const reviewsCounting = Object.assign({}, ...ratingCounts);

    return res.status(200).json({
      status: 1,
      msg: 'Result Found',
      reviewsCounting,
      offset: offset + limit,
      reviews: formattedReviews
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong'
    });
  }
};
