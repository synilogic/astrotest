// withdrawalRequest.js
import express from 'express';
import multer from 'multer';
import Joi from 'joi';
import { Op, Sequelize } from 'sequelize';
import { checkUserApiKey, getTotalBalanceById } from '../_helpers/common.js';
import WithdrawalRequest from '../_models/WithdrawalRequest.js';
import Wallet from '../_models/wallet.js';
import { getConfig } from '../configStore.js';
import dayjs from 'dayjs';
import { formatDateTime } from "../_helpers/dateTimeFormat.js";
import { constants } from "../_config/constants.js";

const router = express.Router();
const upload = multer();

// Helper function to get withdrawal requests (equivalent to getWithdrawalRequest)
const getWithdrawalRequest = async (filter) => {
  try {
    const { astrologer_uni_id, search, status, offset = 0, limit = 10 } = filter;

    const whereCondition = {
      user_uni_id: astrologer_uni_id
    };

    // Add search condition
    if (search) {
      whereCondition[Op.or] = [
        {
          request_message: {
            [Op.like]: `%${search}%`
          }
        }
      ];
    }

    // Add status condition
    if (status !== undefined && status !== '') {
      whereCondition.status = status;
    }

    const getrequest = await WithdrawalRequest.findAll({
      where: whereCondition,
      order: [['id', 'DESC']],
      offset: offset,
      limit: limit,
      raw: true
    });

    // Process the results
    if (getrequest && getrequest.length > 0) {
      getrequest.forEach(value => {
        if (!value.send_message || value.send_message === null) {
          value.send_message = '';
        }
        if (!value.transaction_number || value.transaction_number === null) {
          value.transaction_number = '';
        }
      });
    }

    return getrequest;
  } catch (error) {
    console.error('Error in getWithdrawalRequest:', error);
    throw error;
  }
};

// Helper function to calculate astrologer income (equivalent to astroIncome)
const astroIncome = async (uni_id, fromData = '', toData = '', type = '') => {
  try {
    const whereCondition = {
      user_uni_id: uni_id,
      main_type: 'cr',
      status: 1
    };

    if (fromData) {
      whereCondition.created_at = {
        [Op.gte]: fromData
      };
    }

    if (toData) {
      if (whereCondition.created_at) {
        whereCondition.created_at[Op.lte] = toData;
      } else {
        whereCondition.created_at = {
          [Op.lte]: toData
        };
      }
    }

    const result = await Wallet.findOne({
      where: whereCondition,
      attributes: [
        [Sequelize.literal('ROUND(SUM(amount / exchange_rate), 2)'), 'total_amount']
      ],
      raw: true
    });

    return parseFloat(result?.total_amount || 0);
  } catch (error) {
    console.error('Error in astroIncome:', error);
    return 0;
  }
};

// Add withdrawal request API
router.post("/addWithdrawalRequest", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    request_amount: Joi.number().positive().required(),
    request_message: Joi.string().required(),
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

  const { api_key, astrologer_uni_id: user_uni_id, request_amount, request_message } = attributes;

  try {
    // Check if there's already a pending withdrawal request
    const requestcheck = await WithdrawalRequest.findOne({
      where: {
        user_uni_id: user_uni_id,
        status: '0'
      }
    });

    if (requestcheck) {
      return res.json({
        status: 0,
        msg: "Already Exists",
      });
    }

    // Check authorization
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    // Check balance
    const balance = await getTotalBalanceById(user_uni_id);
    
    if (balance >= request_amount) {
      const withdrawal = {
        user_uni_id: user_uni_id,
        request_amount: request_amount,
        request_message: request_message,
      };

      const result = await WithdrawalRequest.create(withdrawal);
      
      if (result) {
        return res.json({
          status: 1,
          msg: 'Withdrawal request saved successfully',
        });
      } else {
        return res.json({
          status: 0,
          msg: "Something went wrong",
        });
      }
    } else {
      return res.json({
        status: 0,
        msg: "Low balance, Please Check balance",
      });
    }

  } catch (err) {
    console.error("addWithdrawalRequest error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

// Get withdrawal request list API
router.post("/getWithdrawalRequest", upload.none(), async (req, res) => {
  const schema = Joi.object({
    api_key: Joi.string().required(),
    astrologer_uni_id: Joi.string().required(),
    offset: Joi.number().integer().min(0).optional().default(0),
    search: Joi.string().optional(),
    status: Joi.string().optional(),
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

  const { api_key, astrologer_uni_id: user_uni_id, offset = 0, search, status } = attributes;

  try {
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const page_limit = 6; // You can get this from config

    // Get withdrawal requests
    const records = await getWithdrawalRequest({
      astrologer_uni_id: user_uni_id,
      search,
      status,
      offset,
      limit: page_limit
    });

    const formattedRecords = records.map(record => ({
  ...record,
  proof_img:`${req.protocol}://${req.get("host")}/assets/img/${record.proof_img}` || `${req.protocol}://${req.get("host")}${constants.default_image_path}` ,
  created_at: formatDateTime(record.created_at),
  updated_at: formatDateTime(record.updated_at),
}));

    // Calculate income statistics
    const ysday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const currentdate = dayjs().format('YYYY-MM-DD');
    const first_date_of_month = dayjs().startOf('month').format('YYYY-MM-DD');
    const last_date_of_month = dayjs().endOf('month').format('YYYY-MM-DD');
    const first_date_of_last_month = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const last_date_of_last_month = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

    const yesterday_earning = await astroIncome(user_uni_id, ysday, ysday);
    const today_earning = await astroIncome(user_uni_id, currentdate, currentdate);
    const total_earning = await astroIncome(user_uni_id);
    const total_balance = await getTotalBalanceById(user_uni_id);
    const this_month_earning = await astroIncome(user_uni_id, first_date_of_month, last_date_of_month);
    const last_month_earning = await astroIncome(user_uni_id, first_date_of_last_month, last_date_of_last_month);

    const income = {
      today_earning: today_earning ? parseFloat(today_earning.toFixed(2)) : 0,
      yesterday_earning: yesterday_earning ? parseFloat(yesterday_earning.toFixed(2)) : 0,
      total_earning: total_earning ? parseFloat(total_earning.toFixed(2)) : 0,
      total_balance: total_balance ? parseFloat(total_balance.toFixed(2)) : 0,
      this_month_earning: this_month_earning ? parseFloat(this_month_earning.toFixed(2)) : 0,
      last_month_earning: last_month_earning ? parseFloat(last_month_earning.toFixed(2)) : 0,
    };

    if (records && records.length > 0) {
      const result = {
        status: 1,
        data: formattedRecords,
        offset: offset + page_limit,
        income: income,
        msg: 'Withdrawal Request list',
      };
      return res.json(result);
    } else {
      const result = {
        status: 1,
        data: formattedRecords,
        offset: offset + page_limit,
        income: income,
        msg: 'Withdrawal Request list',
      };
      return res.json(result);
    }

  } catch (err) {
    console.error("getWithdrawalRequest error:", err);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      error: err.message
    });
  }
});

export default router;
