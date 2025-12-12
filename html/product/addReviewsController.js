import Review from '../_models/reviews.js';
import User from '../_models/users.js';
import { DummyReview } from '../_models/dummyReviewModel.js';
import { ApiLog } from '../_models/apiLogModel.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { updateApiLogs, saveApiLogs } from '../_helpers/helper.js';
import { Sequelize } from 'sequelize';
import CallHistory from '../_models/call_history.js';

export const addReviews = async (req, res) => {
  const {
    api_key,
    user_uni_id,
    astrologer_uni_id = null,
    review_rating = null,
    review_comment = null,
    uniqeid = ''
  } = req.body;

  if (!api_key || !user_uni_id) {
    return res.status(400).json({
      status: 0,
      msg: 'api_key and user_uni_id are required',
    });
  }

  const isValidApiKey = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidApiKey) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    const reviewData = {
      review_by_id: user_uni_id,
      review_for_id: astrologer_uni_id,
      review_rating,
      review_comment,
      uniqeid
    };

    const review = await Review.create(reviewData);

    if (review) {
      // ✅ Update astrologer rating
      await updateUserRating(astrologer_uni_id);

      // ✅ Mark call as reviewed
      await CallHistory.update(
        { is_review: 1 },
        {
          where: {
            uniqeid,
            customer_uni_id: user_uni_id,
            call_type: 'call',
            status: 'completed',
          },
        }
      );

      return res.json({
        status: 1,
        reviews: review,
        msg: 'Thanks for your feedback',
      });
    } else {
      return res.json({
        status: 0,
        msg: 'Data Not Found !!',
      });
    }
  } catch (error) {
    console.error('Error in addReviews:', error);
    return res.status(500).json({
      status: 0,
      msg: 'Internal Server Error',
    });
  }
};

// ✅ Update astrologer average rating
async function updateUserRating(user_uni_id) {
  try {
    const [results] = await Review.sequelize.query(`
      SELECT AVG(rating) AS avg_rating FROM (
        SELECT review_rating AS rating FROM reviews WHERE review_for_id = :uid AND status = 1
        UNION ALL
        SELECT review_rating AS rating FROM dummy_reviews WHERE review_for_id = :uid AND status = 1
      ) AS combined_reviews
    `, {
      replacements: { uid: user_uni_id },
      type: Sequelize.QueryTypes.SELECT
    });

    const avg_rating = results.avg_rating || 0;
    if (!isNaN(avg_rating)) {
      await User.update({ avg_rating }, { where: { user_uni_id } });
    }
  } catch (err) {
    console.error('Error updating user rating:', err);
  }
}
