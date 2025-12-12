import express from "express";
import dotenv from 'dotenv';
import bcryptjs from "bcryptjs";
import Joi from "joi";
import db from "../../_config/db.js";
import authenticateToken from  "../../_middlewares/auth.js";
import { formatDateTime } from "../dateTimeFormat.js";
import { Op,Sequelize } from "sequelize";
import { generateUserApiKey,generateCustomerUniId,getUserData 
  ,generateAstrologerUniId,
  getAstrologerData,getAstroData,checkUserApiKey} from "../common.js";
import User from "../../_models/users.js";
import Astrologer from "../../_models/astrologers.js";
import Customer from "../../_models/customers.js";

import AstrologerSkill from "../../_models/astrologerSkills.js";
import AstrologerLanguage from "../../_models/astrologerlanguage.js";
import AstrologerSchedule from "../../_models/live_schedules.js";
import CallHistory from "../../_models/call_history.js";

import Skills from "../../_models/skills.js";
import Languages from "../../_models/languages.js"; 
dotenv.config();
const router = express.Router();

export async function getAstrologerQueueList(user_uni_id) {
  try {
    const imgPath = null;
    const imgDefaultPath = null;

    const results = await CallHistory.findAll({
      attributes: [
        'uniqeid',
        'order_date',
        'call_type',
        'status',
        [Sequelize.col('customer.customer_uni_id'), 'customer_uni_id'],
        [Sequelize.col('customer.customer_img'), 'customer_img'],
      ],
      include: [
        {
          model: User,
          as: 'user', // alias must match the association in your model
          required: false,
          attributes: [], // not selecting any fields from User
          on: {
            col1: Sequelize.where(Sequelize.col('user.user_uni_id'), '=', Sequelize.col('call_history.customer_uni_id')),
          },
        },
        {
          model: Customer,
          as: 'customer',
          required: false,
          attributes: [], // we'll pull specific fields via col()
          on: {
             col1: Sequelize.where(Sequelize.col('customer.customer_uni_id'), '=', Sequelize.col('call_history.customer_uni_id')),
          },
        },
      ],
      where: {
        astrologer_uni_id: user_uni_id,
        status: {
          [Sequelize.Op.in]: ['queue', 'queue_request'],
        },
      },
      group: ['call_history.uniqeid'],
      order: [['id', 'ASC']],
      raw: true,
    });

    // Process customer_img
    const processedResults = results.map(row => ({
      ...row,
      customer_img: ImageShow(imgPath, row.customer_img, 'icon', imgDefaultPath),
    }));
    // console.log("process resultsswq sxsxac",processedResults);
    return processedResults.length > 0 ? processedResults : [];

  } catch (error) {
    console.error('Error in getAstrologerQueueList:', error);
    return [];
  }
}
export default getAstrologerQueueList;