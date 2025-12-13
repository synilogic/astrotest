import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';

const router = express.Router();
const upload = multer();

// Get appointment durations list
router.post('/appointmentDurationList', upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    user_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional().default(0),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map((d) => d.message).join('\n'),
    });
  }

  const { api_key, user_uni_id, offset } = value;

  // Check authorization
  const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
  if (!isAuthorized) {
    return res.json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  const page_limit = constants.api_page_limit_secondary || 10;

  try {
    // Import AppointmentDuration model
    const { default: AppointmentDuration } = await import('../_models/appointmentDuration.js');

    const whereCondition = {
      status: 1, // Only active durations
    };

    // If user_uni_id is provided and not empty, filter by it
    // Otherwise, fetch all appointment durations (admin view)
    if (user_uni_id && user_uni_id.trim() !== '') {
      // For customers, show only their durations or public durations (user_uni_id = null)
      whereCondition.user_uni_id = [user_uni_id, null];
    }

    const appointmentDurations = await AppointmentDuration.findAll({
      where: whereCondition,
      order: [['duration', 'ASC']],
      offset,
      limit: page_limit,
      attributes: [
        'id',
        'user_uni_id',
        'duration',
        'duration_type',
        'price',
        'status',
        'created_at',
        'updated_at',
      ],
    });

    return res.json({
      status: 1,
      data: appointmentDurations,
      msg: 'Appointment durations retrieved successfully',
    });
  } catch (err) {
    console.error('Error fetching appointment durations:', err);
    return res.json({
      status: 0,
      msg: 'Something went wrong',
      error: err.message,
    });
  }
});

export default router;

