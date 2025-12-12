// _helpers/services/callHistoryService.js
import { Op, Sequelize } from 'sequelize';
import CallHistory from '../_models/call_history.js';
import UserModel from '../_models/users.js';
import WalletModel from '../_models/wallet.js';
import CustomerModel from '../_models/customers.js';
import IntakeModel from '../_models/IntakeModel.js';
import CallHistoryImagesModel from '../_models/call_history_images.js';
import Astrologer from "../_models/astrologers.js";
import { getConfig } from '../configStore.js';
import dayjs from 'dayjs';
import moment from "moment-timezone";

// Helper functions
const formatTimeForApp = (time) => {
  if (!time) return '';
  // Convert UTC time to user's timezone for display
  return moment.utc(time).tz(userTimezone).format('hh:mm A'); // 12-hour format with AM/PM
};

const formatDateTimeForApp = (datetime) => {
  if (!datetime) return '';
  // Convert UTC time to user's timezone for display
  return moment.utc(datetime).tz(userTimezone).format('YYYY-MM-DD HH:mm:ss');
};

const getCallOfferTypeForApp = (offerType) => {
  // Implement your offer type logic here
  const offerTypes = {
    'percentage': 'Percentage Discount',
    'amount': 'Fixed Amount Discount',
    'free': 'Free Call'
  };
  return offerTypes[offerType] || 'No Offer';
};

const isRepeated = async (customerUniId, astrologerUniId, uniqeid) => {
  try {
    const count = await CallHistory.count({
      where: {
        customer_uni_id: customerUniId,
        astrologer_uni_id: astrologerUniId,
        uniqeid: { [Op.ne]: uniqeid }
      }
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking repeated calls:', error);
    return false;
  }
};

const isInternational = async (astrologerUniId, customerUniId) => {
  try {
    // Implement your international call logic here
    // This might involve checking user countries or other criteria
    return false; // Default to false
  } catch (error) {
    console.error('Error checking international calls:', error);
    return false;
  }
};

export const astroCallHistory = async (call_history) => {
  try {
    const limit = call_history.limit || 15; // Default limit
    const offset = call_history.offset || 0;

    // Build the query with all the joins
    const callingHistory = await CallHistory.findAll({
      include: [
         {
      model: WalletModel,
      as: 'wallets',
      required: false,
      on: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.col('wallets.user_uni_id'),
            '=',
            Sequelize.col('call_history.astrologer_uni_id')
          ),
          Sequelize.where(
            Sequelize.col('wallets.reference_id'),
            '=',
            Sequelize.col('call_history.uniqeid')
          )
        ]
      }
    },
       {
          model: IntakeModel,
          as: 'intake',
          required: false
        },
        {
          model: UserModel,
          as: 'user',
          required: false,
          attributes: ['phone', 'name', 'email', 'user_fcm_token', 'user_ios_token', 'country_name', 'user_uni_id'],
         
        },
        {
          model: CustomerModel,
          as: 'customer',
          required: false,
         
        },
        {
          model: Astrologer,
          as: 'astrologer',
          required: false,
          attributes: ['astrologer_uni_id', 'display_name', 'astro_img']
        },
        
      ],
  
       where: {
        astrologer_uni_id: call_history.user_uni_id,
        ...(call_history.call_type === 'live' && {
          call_type: {
            [Op.in]: ['videocallwithlive', 'callwithlive', 'privatecallwithlive', 'privatevideocallwithlive']
          }
        }),
        ...(call_history.call_type && call_history.call_type !== 'live' && {
          call_type: call_history.call_type
        })
      },
      group: ['call_history.id'],
      order: [['id', 'DESC']],
      limit: limit,
      offset: offset,
      raw: false
    });

    // Process the results
    const processedResults = await Promise.all(
      callingHistory.map(async (record) => {
        const result = record.toJSON();

      const wallet = result.wallets?.[0] || {};

      const calculateWalletAmount = (wallets, field) => {
          if (!wallets || wallets.length === 0) return '0.00';
          
          const total = wallets.reduce((sum, wallet) => {
            const value = parseFloat(wallet[field] || 0);
            const rate = parseFloat(wallet.exchange_rate || 1);
            return sum + (rate !== 0 ? value / rate : 0);
          }, 0);
          
          return total.toFixed(2);
        };


result.reference_id = wallet.reference_id || null;
result.gateway_order_id = wallet.gateway_order_id || null;
result.gateway_payment_id = wallet.gateway_payment_id || null;
result.transaction_code = wallet.transaction_code || null;
result.wallet_history_description = wallet.wallet_history_description || null;
result.transaction_amount = parseFloat(wallet.transaction_amount || 0).toFixed(2);
result.amount = parseFloat(wallet.amount || 0).toFixed(2);
result.main_type = wallet.main_type || null;
result.created_by = wallet.created_by || null;
result.admin_percentage = parseFloat(wallet.admin_percentage || 0).toFixed(2);
result.gst_amount = parseFloat(wallet.gst_amount || 0).toFixed(2);
result.astro_amount = parseFloat(wallet.astro_amount || 0).toFixed(2);
result.admin_amount = parseFloat(wallet.admin_amount || 0).toFixed(2);
result.tds_amount = parseFloat(wallet.tds_amount || 0).toFixed(2);
result.offer_amount = parseFloat(wallet.offer_amount || 0).toFixed(2);
result.gateway_charge = parseFloat(wallet.gateway_charge || 0).toFixed(2);
result.coupan_amount = parseFloat(wallet.coupan_amount || 0).toFixed(2);
result.currency = wallet.currency || null;
result.payment_method = wallet.payment_method || null;
result.payment_mode = wallet.payment_mode || null;
result.where_from = wallet.where_from || null;
result.status = result.status || null; // fallback to call_history status
result.gift_status = wallet.gift_status || null;
result.offer_status = wallet.offer_status || 0;
result.currency_code = wallet.currency_code || 'INR';
result.currency_symbol = wallet.currency_symbol || '₹';
result.exchange_rate = parseFloat(wallet.exchange_rate || 1).toFixed(2);
result.invoice_file = wallet.invoice_file || null;
result.created_at = wallet.created_at || result.created_at || null;
result.updated_at = wallet.updated_at || result.updated_at || null;

 const customerWallets = result.customer?.wallets || [];
  result.customer_amount = calculateWalletAmount(customerWallets, 'amount');



        

        //user details
        result.phone = result.user?.phone || null;
        result.name = result.user?.name || null;
        result.email = result.user?.email || null;
        result.user_fcm_token = result.user?.user_fcm_token || null;
        result.user_ios_token = result.user?.user_ios_token || null;
        result.country_name = result.user?.country_name || null;

          // Handle customer image
        if (result.customer?.customer_img) {
          const imgPath = 'uploads/customer/';
          result.customer_img = `https://astro.synilogictech.com/${imgPath}${result.customer.customer_img}`;
        } else {
          result.customer_img = 'https://astro.synilogictech.com/assets/img/customer.png';
        }

        // Format call history images exists
        result.call_history_images_exists = Number(result.call_history_images_exists) || 0;

         // Get user's timezone from customer data
        // const userTimezone = result.customer?.time_zone || 'Asia/Kolkata';

        // result.call_start = formatTimeForApp(result.call_start, userTimezone);
        // result.call_end = formatTimeForApp(result.call_end, userTimezone);
        // result.order_datetime = formatDateTimeForApp(result.created_at, userTimezone);

         result.call_start = moment(result.call_start).format('HH:mm:ss');
        result.call_end =  moment(result.call_end).format('HH:mm:ss');
        // result.order_datetime = result.created_at;

         result.offer_applied = getCallOfferTypeForApp(result.offer_type);
        result.max_duration = parseInt(result.waiting_time) || 0;
        result.is_repeated = await isRepeated(result.customer_uni_id, result.astrologer_uni_id, result.uniqeid) ? 1 : 0;
        result.is_international = await isInternational(result.astrologer_uni_id, result.customer_uni_id) ? 1 : 0;


        
         delete  result.wallets;
         delete result.user;
         delete result.customer;
         delete result.astrologer;
        return result;
      })
    );

    return processedResults;
  } catch (error) {
    console.error('Error in astroCallHistory:', error);
    throw error;
  }
};