
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from "joi";
import db from "../_config/db.js";
import "../_models/index.js";
import UserModel from '../_models/users.js';
import AstrologerDiscount from '../_models/astrologer_discounts.js';
import AstrologerDiscountAssign from '../_models/astrologer_discount_assigns.js';
import CallHistory from '../_models/call_history.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import { Op } from 'sequelize';

dotenv.config();

const router = express.Router();
const upload = multer();

// Helper function to get astrologer discount (equivalent to getAstroDiscount)
const getAstroDiscount = async (astrologer_uni_id) => {
  try {
    const astroDiscount = await AstrologerDiscountAssign.findOne({
      where: {
        astrologer_uni_id: astrologer_uni_id,
        status: 1
      },
      attributes: ['astrologer_discount_id'],
      raw: true
    });
    return astroDiscount;
  } catch (error) {
    console.error('Error getting astrologer discount:', error);
    return null;
  }
};

// Helper function to remove queue list (equivalent to removeQueueList)
const removeQueueList = async (astrologer_uni_id, status, call_type = '') => {
  try {
    const whereCondition = {
      astrologer_uni_id: astrologer_uni_id,
      status: {
        [Op.in]: ['queue', 'queue_request', 'request']
      }
    };

    if (call_type) {
      whereCondition.call_type = call_type;
    }

    await CallHistory.update(
      { status: status },
      { where: whereCondition }
    );

    // Remove busy status (you can implement this function as needed)
    await removeBusyStatus(astrologer_uni_id);
  } catch (error) {
    console.error('Error removing queue list:', error);
  }
};

// Helper function to remove busy status
const removeBusyStatus = async (astrologer_uni_id) => {
  try {
    // Implement your busy status removal logic here
    // This might involve updating user status or other related tables
    console.log(`Removing busy status for astrologer: ${astrologer_uni_id}`);
  } catch (error) {
    console.error('Error removing busy status:', error);
  }
};

// Helper function to get assigned discount list (equivalent to assignAstrologerDiscountList)
const assignAstrologerDiscountList = async (request) => {
  try {
    const { astrologer_uni_id, offset = 0, limit = 10 } = request;

    const result = await AstrologerDiscountAssign.findAll({
      where: {
        astrologer_uni_id: astrologer_uni_id,
        status: 1
      },
      order: [['start_from', 'ASC']],
      offset: offset,
      limit: limit,
      attributes: [
        'id',
        'astrologer_uni_id',
        'astrologer_discount_id',
        'title',
        'duration',
        'start_from',
        'end_at',
        'discount_percent',
        'call_status',
        'chat_status',
        'video_status',
        'status',
        'created_at',
        'updated_at'
      ],
      raw: true
    });

    return result;
  } catch (error) {
    console.error('Error in assignAstrologerDiscountList:', error);
    throw error;
  }
};

router.post("/astrologerDiscountList", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(err => err.message).join('\n')
    });
  }

  const { api_key, astrologer_uni_id } = attributes;

  try {
    const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    // Get astrologer discount ID
    let astrologer_discount_id = 0;
    const astroDiscount = await getAstroDiscount(astrologer_uni_id);
    if (astroDiscount) {
      astrologer_discount_id = astroDiscount.astrologer_discount_id;
    }

    // Get all active discounts
    const discountList = await AstrologerDiscount.findAll({
      where: {
        status: 1
      },
      raw: true
    });

    // Process discount list to add is_enabled flag
    if (discountList && discountList.length > 0) {
      discountList.forEach(discount => {
        discount.is_enabled = (astrologer_discount_id > 0 && discount.id == astrologer_discount_id) ? 1 : 0;
      });
    }

    if (discountList && discountList.length > 0) {
      const result = {
        status: 1,
        discountList: discountList,
        msg: "Success",
      };
      return res.json(result);
    } else {
      const result = {
        status: 0,
        msg: 'No Data Found',
      };
      return res.json(result);
    }

  } catch (err) {
    console.error("astrologerDiscountList error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

router.post("/assignAstrologerDiscount", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    discount_id: Joi.number().integer().required(),
    status: Joi.number().integer().optional().default(0),
    call_status: Joi.number().integer().optional(),
    chat_status: Joi.number().integer().optional(),
    video_status: Joi.number().integer().optional(),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(err => err.message).join('\n')
    });
  }

  const { api_key, astrologer_uni_id, discount_id, status = 0 } = attributes;

  try {
    const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    // Get the discount details
    const astrologer_discount = await AstrologerDiscount.findOne({
      where: {
        id: discount_id,
        status: 1
      },
      raw: true
    });

    if (!astrologer_discount) {
      return res.json({
        status: 0,
        msg: 'Invalid Discount Selected',
      });
    }

    // Get existing astrologer discount assignment
    const astroDiscount = await getAstroDiscount(astrologer_uni_id);

    if (astroDiscount) {
      if (status == 1) {
        return res.json({
          status: 0,
          msg: 'You already have an active discount.',
        });
      } else {
        const astrologer_discount_id = astroDiscount.astrologer_discount_id;

        if (astrologer_discount_id == discount_id) {
          const astroDiscountAssign = await AstrologerDiscountAssign.findOne({
            where: {
              astrologer_uni_id: astrologer_uni_id,
              astrologer_discount_id: discount_id,
              status: 1
            }
          });

          if (astroDiscountAssign) {
            await astroDiscountAssign.update({ status: 0 });

            await removeQueueList(astrologer_uni_id, 'Declined(Astrologer Offer)');

            const result = {
              status: 1,
              data: {
                ...astroDiscountAssign.toJSON(),
                astrologer_discount_id: parseInt(astroDiscountAssign.astrologer_discount_id)
              },
              msg: 'Astrologer discount removed successfully',
            };
            return res.json(result);
          } else {
            return res.json({
              status: 0,
              msg: 'Invalid request',
            });
          }
        } else {
          return res.json({
            status: 0,
            msg: 'Invalid request',
          });
        }
      }
    } else {
      // No existing discount, create new assignment
      const duration = astrologer_discount.duration;
      const start_from = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const end_at = new Date(Date.now() + duration * 60000).toISOString().slice(0, 19).replace('T', ' ');

      const call_status = (attributes.call_status && attributes.call_status == '1') ? 1 : 0;
      const chat_status = (attributes.chat_status && attributes.chat_status == '1') ? 1 : 0;
      const video_status = (attributes.video_status && attributes.video_status == '1') ? 1 : 0;

      // Check for existing overlapping discounts
      const existingDiscount = await AstrologerDiscountAssign.findOne({
        where: {
          astrologer_uni_id: astrologer_uni_id,
          status: 1,
          [Op.or]: [
            {
              start_from: {
                [Op.between]: [start_from, end_at]
              }
            },
            {
              end_at: {
                [Op.between]: [start_from, end_at]
              }
            }
          ],
          [Op.or]: [
            { call_status: call_status },
            { chat_status: chat_status },
            { video_status: video_status }
          ].filter(condition => Object.values(condition)[0] === 1)
        }
      });

      if (existingDiscount) {
        return res.json({
          status: 0,
          msg: 'You already have an active discount.',
        });
      }

      // Create new discount assignment
      const saveData = {
        astrologer_uni_id: astrologer_uni_id,
        astrologer_discount_id: discount_id,
        title: astrologer_discount.title,
        duration: duration,
        start_from: start_from,
        end_at: end_at,
        discount_percent: astrologer_discount.discount_percent,
        call_status: call_status,
        chat_status: chat_status,
        video_status: video_status,
        status: 1,
      };

      const records = await AstrologerDiscountAssign.create(saveData);

      const result = {
        status: 1,
        data: {
          ...records.toJSON(),
          astrologer_discount_id: parseInt(records.astrologer_discount_id)
        },
        msg: 'Astrologer discount save successfully',
      };
      return res.json(result);
    }

  } catch (err) {
    console.error("assignAstrologerDiscount error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

router.post("/assignAstrologerDiscountList", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional().default(0),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(err => err.message).join('\n')
    });
  }

  const { api_key, astrologer_uni_id } = attributes;

  try {
    const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const offset = attributes.offset || 0;
    const page_limit = 10; // You can get this from config like in Laravel

    // Get assigned discount list
    const result = await assignAstrologerDiscountList({
      astrologer_uni_id,
      offset,
      limit: page_limit
    });

    if (result && result.length > 0) {
      const response = {
        status: 1,
        offset: offset + page_limit,
        data: result,
        msg: 'Get successfully',
      };
      return res.json(response);
    } else {
      const response = {
        status: 0,
        msg: 'No data found',
      };
      return res.json(response);
    }

  } catch (err) {
    console.error("assignAstrologerDiscountList error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

router.post("/astrologerDiscountStatusChange", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    discount_assign_id: Joi.number().integer().required(),
    status: Joi.number().integer().required(),
  });

  const { error, value: attributes } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      errors: error.details,
      message: 'Something went wrong',
      msg: error.details.map(err => err.message).join('\n')
    });
  }

  const { api_key, astrologer_uni_id, discount_assign_id, status } = attributes;

  try {
    const isAuthorized = await checkUserApiKey(api_key, astrologer_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const current_datetime = new Date();
    
    // Find the discount assignment
    const astrologer_discount_assign = await AstrologerDiscountAssign.findOne({
      where: {
        astrologer_uni_id: astrologer_uni_id,
        id: discount_assign_id
      }
    });

    if (!astrologer_discount_assign) {
      return res.json({
        status: 0,
        msg: 'Invalid record',
      });
    }

    // Check if discount is expired
    if (astrologer_discount_assign.end_at <= current_datetime) {
      return res.json({
        status: 0,
        msg: 'This discount is already expired',
      });
    }

    // Check if status is already the same
    if (status == astrologer_discount_assign.status) {
      const msg = status == 1 ? 'Active' : 'In-Active';
      return res.json({
        status: 1,
        msg: `This discount is already ${msg}`,
      });
    }

    // Check for overlapping discounts if trying to activate
    if (status == 1) {
      const start_from = astrologer_discount_assign.start_from;
      const end_at = astrologer_discount_assign.end_at;
      const call_status = astrologer_discount_assign.call_status;
      const chat_status = astrologer_discount_assign.chat_status;
      const video_status = astrologer_discount_assign.video_status;

      // Build overlapping conditions
      const overlappingConditions = [];
      
      if (call_status == 1) {
        overlappingConditions.push({ call_status: call_status });
      }
      if (chat_status == 1) {
        overlappingConditions.push({ chat_status: chat_status });
      }
      if (video_status == 1) {
        overlappingConditions.push({ video_status: video_status });
      }

      const existingDiscount = await AstrologerDiscountAssign.findOne({
        where: {
          astrologer_uni_id: astrologer_uni_id,
          status: 1,
          id: { [Op.ne]: discount_assign_id },
          [Op.or]: [
            {
              start_from: {
                [Op.between]: [start_from, end_at]
              }
            },
            {
              end_at: {
                [Op.between]: [start_from, end_at]
              }
            }
          ],
          [Op.or]: overlappingConditions
        }
      });

      if (existingDiscount) {
        return res.json({
          status: 0,
          msg: `between ${start_from} to ${end_at}, ${existingDiscount.title} discount is already active`,
        });
      }
    }

    // Update the discount status
    const updateResult = await astrologer_discount_assign.update({
      status: status
    });

    if (updateResult) {
      const msg = status == 1 ? 'Active' : 'In-Active';
      
      // Remove queue list if deactivating
      if (status == 0) {
        await removeQueueList(astrologer_uni_id, 'Declined(Astrologer Offer)');
      }

      return res.json({
        status: 1,
        msg: `Discount ${msg} successfully`,
      });
    } else {
      return res.json({
        status: 0,
        msg: 'Something went wrong',
      });
    }

  } catch (err) {
    console.error("astrologerDiscountStatusChange error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

export default router;
