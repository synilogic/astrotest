import dotenv from "dotenv";
import fs from "fs";
import path, { join } from "path";
import axios from "axios";
import { Op, Sequelize, literal, QueryTypes, col, NOW } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { formatDateTime, dobFormatForApp, tobFormatForApp, getUserAssets, } from "./dateTimeFormat.js";
import sequelize from "../_config/db.js";
import dayjs from "dayjs";
import moment from "moment-timezone";
import numberShorten from "./numberShorten.js";
import { constants, imagePath, ROLE_IDS, CURRENCY } from "../_config/constants.js";
import { getConfig } from "../configStore.js";
import sharp from "sharp";
dotenv.config();

import { getCurrency, getTotalBalanceById, isFirstUser, getAstrologerById, getApprovedArchitectRequest} from "./common.js";

import "../_models/index.js";
import User from "../_models/users.js";
import Astrologer from "../_models/astrologers.js";
import CallHistory from "../_models/call_history.js";
import Customer from "../_models/customers.js";
import Skill from "../_models/skills.js";
import Review from "../_models/reviews.js";
import AstrologerGallery from "../_models/astrologer_galleries.js";
import Category from "../_models/categories.js";
import Language from "../_models/languages.js";
import Follower from "../_models/followers.js";
import AstrologerDocument from "../_models/astrologer_documents.js";
import ApiKeys from "../_models/apikeys.js";
import Wallet from "../_models/wallet.js";
import Vendor from "../_models/vendor.js";
import AstrologerPrice from "../_models/astrologer_prices.js";
import Intake from "../_models/IntakeModel.js";
import ChatChannel from "../_models/chatChannelModel.js";
import ChatChannelHistory from "../_models/chatChannelHistoryModel.js";
import ApiKeyModel from "../_models/apikeys.js";
import AstrologerDiscountAssign from "../_models/astrologer_discount_assigns.js";
import SequenceCode from "../_models/sequence_code.js";
import SlotBooking from "../_models/slot_bookings.js";


// import DiscountAssign from "../_models/astrologer_discount_assigns.js";
// import { checkFirebaseCustomAuthToken } from "./checkFirebaseCustomAuthToken.js";

const startingSequence = 98;
const customerstartingSequence = 200;
const filePath = path.resolve("astro-sequence.json");
const CustomerfilePath = path.resolve("customer-sequence.json");


export const checkCallToken = async (uniqeid = "") => {
  let status = false;
  if (uniqeid) {
    const callHistory = await CallHistory.findOne({
      where: { uniqeid: uniqeid },
    });
    if (callHistory && callHistory.token && callHistory.token !== null) {
      status = false;
    } else {
      status = true;
    }
  }
  return status;
};



export const getAstroPriceDataType = async (
  astrologer_id,
  type,
  currency = "INR",
  customer_uni_id = ""
) => {
  try {
    const resolvedCurrency = await Promise.resolve(currency);

    let result = await AstrologerPrice.findOne({
      where: {
        astrologer_uni_id: astrologer_id,
        type: type,
        currency: resolvedCurrency,
      },
    });

    let other_offer_type = 0;

    // Only apply astrologer discount, no first call logic
    const astroDiscount = await getAstroDiscount(astrologer_id);
    if (astroDiscount) {
      result.price = await getAstroDiscountedPrice(
        astrologer_id,
        result.price,
        astroDiscount.discount_percent
      );
      other_offer_type = astroDiscount.offer_type;
    }

    result.other_offer_type = other_offer_type;

    return result;
  } catch (error) {
    console.error("Error in getAstroPriceDataType:", error);
    throw error;
  }
};

export const getAstroDiscount = async (astrologer_uni_id = "", type = "") => {
  try {
    let result = null;
    const is_type_based = 0;
    let is_type_checked = 1;
    const astrologer_discount_on = getConfig("astrologer_discount_on");

    if (is_type_based === 1) {
      is_type_checked = 0;
      if (type && astrologer_discount_on.includes(type)) {
        is_type_checked = 1;
      }
    }

    if (astrologer_uni_id && is_type_checked === 1) {
      const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

      let whereClause = {
        astrologer_uni_id,
        start_from: { [Op.lte]: now },
        end_at: { [Op.gte]: now },
        status: 1,
      };

      if (is_type_based === 1) {
        if (type === "call") whereClause.call_status = 1;
        if (type === "chat") whereClause.chat_status = 1;
        if (type === "video") whereClause.video_status = 1;
      }

      const discount = await AstrologerDiscountAssign.findOne({
        where: whereClause,
      });

      if (discount) {
        discount.offer_type = 4;
        result = discount;
      }
    }

    return result;
  } catch (error) {
    console.error("Error in getAstroDiscount:", error);
    return null;
  }
};

export const getAstroDiscountedPrice = async (
  astrologer_uni_id = "",
  price = 0,
  discount_percent = 0
) => {
  let discounted_price = price;

  if (
    typeof discount_percent === "number" &&
    discount_percent > 0 &&
    typeof price === "number" &&
    price > 0
  ) {
    if (discount_percent >= 100) {
      discounted_price = 0;
    } else {
      discounted_price =
        price - Math.round(((discount_percent * price) / 100) * 100) / 100;
    }
  }

  return discounted_price;
};

export const alreadySentRequestUniqeid = async (
  customer_uni_id = "",
  astrologer_uni_id = ""
) => {
  if (!customer_uni_id) return "";

  const whereCondition = {
    customer_uni_id,
    status: {
      [Op.or]: ["queue", "queue_request", "request", "in-progress"],
    },
    ...(astrologer_uni_id && { astrologer_uni_id }),
  };

  const record = await CallHistory.findOne({ where: whereCondition });
  return record?.uniqeid || "";
};


export const getCustomerQueueList = async (user_uni_id) => {
  try {
    let result = [];

    const callHistoryList = await CallHistory.findAll({
      attributes: [
        ['id', 'notification_id'],
        'uniqeid',
        'order_date',
        'call_type',
        'status',
        [Sequelize.col('astrologer.display_name'), 'display_name'],
        [Sequelize.col('astrologer.astrologer_uni_id'), 'astrologer_uni_id'],
        [Sequelize.col('astrologer.astro_img'), 'astro_img'],
        [Sequelize.col('astrologer.is_virtual'), 'is_virtual'],
        [Sequelize.literal(`IFNULL((
          SELECT SUM(chw.waiting_time) FROM call_history AS chw
          WHERE chw.astrologer_uni_id = astrologer.astrologer_uni_id 
          AND chw.status IN ('queue', 'queue_request', 'request', 'in-progress')
          GROUP BY chw.astrologer_uni_id
        ), 0)`), 'total_waiting_time'],
        [Sequelize.literal(`IFNULL((
          SELECT SUM(IF(chq.waiting_time > 0, 1, 0)) FROM call_history AS chq
          WHERE chq.astrologer_uni_id = astrologer.astrologer_uni_id 
          AND chq.status IN ('queue', 'queue_request', 'request', 'in-progress')
          GROUP BY chq.astrologer_uni_id
        ), 0)`), 'total_queue_count']
      ],
      include: [
        {
          model: User,
          as: 'user',
          required: false,
          attributes: [],
        },
        {
          model: Astrologer,
          as: 'astrologer',
          required: false,
          attributes: [],
        },
        {
          model: Intake,
          as: 'intake', 
          required: false,
        }
      ],
      where: {
        customer_uni_id: user_uni_id, 
        // astrologer_uni_id: user_uni_id,
        status: {
          [Op.in]: ['queue', 'queue_request', 'request', 'in-progress']
        }
      },
      order: [['id', 'ASC']],
      raw: true,
      nest: true
    });
    const currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss");

    for (let i = 0; i < callHistoryList.length; i++) {
      const value = callHistoryList[i];
      const [sequence] = await sequelize.query(
        `SELECT * FROM (
          SELECT @rownum := @rownum + 1 AS my_queue_number,
            @waiting_time := @waiting_time + chn.waiting_time AS my_waiting_time,
            chn.waiting_time,
            chn.uniqeid,
            IF(chn.status = 'in-progress', TIMESTAMPDIFF(SECOND, chn.call_start, '${currentDateTime}'), 0) AS in_progress_waiting,
            chn.customer_uni_id,
            chn.astrologer_uni_id
          FROM call_history chn, (SELECT @rownum := 0, @waiting_time := 0) r
          WHERE chn.astrologer_uni_id = '${value.astrologer_uni_id}'
          AND chn.status IN ('queue', 'queue_request', 'request', 'in-progress')
          ORDER BY chn.created_at ASC
        ) a
        WHERE a.customer_uni_id = '${user_uni_id}' AND a.uniqeid = '${value.uniqeid}'`
      );
      callHistoryList[i].my_queue_number = sequence?.my_queue_number || 0;
      callHistoryList[i].my_waiting_time = sequence?.my_waiting_time || 0;
      callHistoryList[i].in_progress_waiting = sequence?.in_progress_waiting || '0';

      const ongoing_history = await CallHistory.findOne({
        where: {
          uniqeid: value.uniqeid,
          status: {
            [Op.in]: ['queue', 'queue_request', 'request', 'in-progress']
          }
        }
      });
      if (ongoing_history) {
        callHistoryList[i].total_waiting_time -= ongoing_history.waiting_time;
        callHistoryList[i].my_waiting_time -= ongoing_history.waiting_time;
        if (callHistoryList[i].total_waiting_time < 0) {
          callHistoryList[i].total_waiting_time = 0;
          callHistoryList[i].my_waiting_time = 0;
        }
        callHistoryList[i].total_waiting_time = String(callHistoryList[i].total_waiting_time);
      }
      const imgPath = constants.astrologer_image_path;
      const imgDefaultPath = constants.default_astrologer_image_path;
      callHistoryList[i].astro_img = ImageShow(imgPath, value.astro_img, 'icon', imgDefaultPath);
      let in_app_call = 0;
      if (value.call_type === 'call' && value.is_inapp_voice_call && value.is_inapp_voice_call === 1) {
        in_app_call = 1;
      }
      callHistoryList[i].in_app_call = in_app_call;
    }

    if (callHistoryList.length > 0) {
      result = callHistoryList;
    }

    return result;
  } catch (error) {
    console.error("Error in getCustomerQueueList:", error);
    return [];
  }
};

export const remainingChatTime = async (uniqeid = "") => {
  try {
    const result = {};
    let remaining_time_in_second = 0;
    let minutes = 0;
    let call_status = "";

    const callHistory = await CallHistory.findOne({
      where: {
        uniqeid,
        status: {
          [Op.or]: ["queue", "queue_request", "request", "in-progress"],
        },
      },
      include: [
        {
          model: UserModel,
          as: "customer_user",
          attributes: ["name"],
          required: false,
        },
        {
          model: Astrologer,
          as: "astrologer",
          attributes: ["display_name"],
          required: false,
        },
      ],
    });

    

    if (callHistory) {
      call_status = callHistory.status;
      const call_type = callHistory.call_type;
      const waiting_time = callHistory.waiting_time || 0;
      const call_start = callHistory.call_start;
      const is_inapp_voice_call = callHistory.is_inapp_voice_call;

      const now = Math.floor(Date.now() / 1000);

      if (
        call_type === "chat" &&
        (call_status === "in-progress" || call_status === "request")
      ) {
        if (call_status === "in-progress" && call_start) {
          const start = Math.floor(new Date(call_start).getTime() / 1000);
          remaining_time_in_second = waiting_time - (now - start);
        } else {
          remaining_time_in_second = waiting_time;
        }
      } else if (
        call_type === "video" &&
        (call_status === "in-progress" || call_status === "request")
      ) {
        if (call_status === "in-progress" && call_start) {
          const start = Math.floor(new Date(call_start).getTime() / 1000);
          remaining_time_in_second = waiting_time - (now - start);
        } else {
          remaining_time_in_second = waiting_time;
        }
      } else if (
        call_type === "call" &&
        (call_status === "in-progress" || call_status === "request") &&
        is_inapp_voice_call === 1
      ) {
        if (call_status === "in-progress" && call_start) {
          const start = Math.floor(new Date(call_start).getTime() / 1000);
          remaining_time_in_second = waiting_time - (now - start);
        } else {
          remaining_time_in_second = waiting_time;
        }
      }

      if (remaining_time_in_second > 0) {
        minutes = Math.round((remaining_time_in_second / 60) * 100) / 100;
      } else {
        remaining_time_in_second = 0;
      }
    }

    result.call_status = call_status;
    result.remaining_time_in_second = remaining_time_in_second;
    result.minutes = minutes;

    return result;
  } catch (error) {
    console.error("Error in remainingChatTime:", error);
    return {
      call_status: "",
      remaining_time_in_second: 0,
      minutes: 0,
    };
  }
};

export const removeBusyStatus = async (astrologer_uni_id) => {
  try {
    const call_history = await CallHistory.findAll({
      include: [
        {
          model: UserModel,
          as: "customer_user", // Changed from "users" to "customer_user"
          required: false,
        },
      ],
      where: {
        astrologer_uni_id,
        status: {
          [Op.in]: ["queue", "queue_request", "request", "in-progress"],
        },
      },
    });

    if (call_history.length === 0) {
      await Astrologer.update(
        { busy_status: "0" },
        { where: { astrologer_uni_id } }
      );
    }
  } catch (error) {
    console.error("Error in removeBusyStatus:", error);
  }
};

export const waitingCustomer = async (astrologer_uni_id) => {
  let getRequest = {};
  try {
    const runningCount = await CallHistory.count({
      where: {
        astrologer_uni_id,
        status: {
          [Op.in]: ["request", "in-progress"],
        },
        call_type: {
          [Op.in]: ["call", "chat", "video"],
        },
      },
    });

    if (runningCount === 0) {
      const queuedCalls = await CallHistory.findAll({
        where: {
          astrologer_uni_id,
          status: "queue",
        },
        include: ["user"],
        order: [["id", "ASC"]],
      });

      const current_datetime = getConfig("current_datetime");

      for (const history of queuedCalls) {
        const astrologer = await Astrologer.findOne({
          where: { astrologer_uni_id },
        });
        const currency = getCurrency(history.user?.phone);
        const astroPrice = await getAstroPriceDataType(
          astrologer_uni_id,
          history.call_type,
          currency,
          history.customer_uni_id
        );

        const user_wallet_amt = await getTotalBalanceById(
          history.customer_uni_id
        );

        if (astroPrice?.price > 0) {
          if (astroPrice.price <= user_wallet_amt) {
            if (
              !astrologer.next_request_time ||
              astrologer.next_request_time !== current_datetime
            ) {
              await astrologer.update({ next_request_time: current_datetime });

              getRequest = {
                id: history.id,
                user_uni_id: history.customer_uni_id,
                astrologer_uni_id: history.astrologer_uni_id,
                call_type: history.call_type,
              };

              return getRequest;
            }
          } else {
            await CallHistory.update(
              { status: "Declined(Insufficient Balance)" },
              { where: { uniqeid: history.uniqeid } }
            );
            await removeBusyStatus(astrologer_uni_id);
          }
        } else {
          await CallHistory.update(
            { status: "Declined(Insufficient Balance)" },
            { where: { uniqeid: history.uniqeid } }
          );
          await removeBusyStatus(astrologer_uni_id);
        }
      }
    }

    return getRequest;
  } catch (error) {
    console.error("Error in waitingCustomer:", error);
    return {};
  }
};

export const availableMinuteCalculat = async (
  price,
  per_minutes,
  total_balance,
  customer_uni_id = "",
  call_type = ""
) => {
  let total_minutes = 0;

  // Simple calculation based on balance only
  const per_minutes_val = per_minutes || 1;
  if (price > 0 && per_minutes_val > 0 && total_balance > 0) {
    total_minutes = Math.floor(total_balance / price) * per_minutes_val;
  }

  total_minutes = Math.floor(total_minutes);
  const call_max_minutes = constants.call_max_minutes;
  if (call_max_minutes && !isNaN(call_max_minutes)) {
    const max_minutes = Math.floor(call_max_minutes);
    if (total_minutes > max_minutes) total_minutes = max_minutes;
  }

  return total_minutes;
};

export const waitingTime = async (astrologer_uni_id) => {
  try {
    const call_history = await CallHistory.findAll({
      include: [
        {
          model: User,
          as: "customer_user",
          on: {
            user_uni_id: {
              [Op.eq]: Sequelize.col("call_history.customer_uni_id"),
            },
          },
        },
      ],
      where: {
        astrologer_uni_id,
        status: {
          [Op.in]: ["queue", "queue_request", "request", "in-progress"],
        },
      },
    });

    let availableMinute = 0;
    for (const history of call_history) {
      try {
        const currency = await getCurrency(history.customer_user.phone);

        const astrologer_price = await getAstroPriceDataType(
          astrologer_uni_id,
          history.call_type,
          currency,
          history.customer_uni_id
        );

        if (!astrologer_price) {
          console.warn(`No price found for astrologer ${astrologer_uni_id}`);
          continue;
        }

        const user_wallet_amt = await getTotalBalanceById(
          history.customer_uni_id
        );

        const minutes = await availableMinuteCalculat(
          astrologer_price.price,
          astrologer_price.time_in_minutes,
          user_wallet_amt,
          history.customer_uni_id,
          history.call_type
        );

        availableMinute += minutes;
      } catch (error) {
        console.error(`Error processing call history ${history.id}:`, error);
        continue;
      }
    }
    return availableMinute;
  } catch (error) {
    console.error("Error in waitingTime:", error);
    return 0;
  }
};

export const new_sequence_code = async (code) => {
  try {
    let rescode = await SequenceCode.findOne({ where: { sequence_code: code } });

    if (!rescode) {
      rescode = await SequenceCode.create({
        sequence_code: code,
        sequence_number: "0000",
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    const currentSeqNum = parseInt(rescode.sequence_number || "0", 10) || 0;
    const nextSeqNum = currentSeqNum + 1;
    const paddedSeq = String(nextSeqNum).padStart(4, "0");
    const uniqueId = code + paddedSeq;

    await SequenceCode.update(
      { sequence_number: paddedSeq, updated_at: new Date() },
      { where: { sequence_code: code } }
    );

    return uniqueId;
  } catch (error) {
    console.error("Error in new_sequence_code:", error);
    return null;
  }
};

export const exotelCustomerWhitelistCurl = async (Number) => {
  try {
    const postData = new URLSearchParams({
      VirtualNumber: process.env.EXOTEL_CALLER_ID,
      Number,
      Language: "en",
    });

    const apiKey = getConfig("export_api_key");
    const apiToken = getConfig("export_api_token");
    const exotelSid = getConfig("export_sid");
    const subdomain = getConfig("export_api_subdomaim");

    const url = `https://${apiKey}:${apiToken}${subdomain}/v1/Accounts/${exotelSid}/CustomerWhitelist.json`;

    const response = await axios.post(url, postData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Exotel whitelist error:",
      error.response?.data || error.message
    );
    return null;
  }
};

export const callTransations = async (data) => {
  try {
    const {
      uniqeid,
      startTime,
      endTime,
      duration,
      RecordingUrl = "",
      call_type: inputCallType,
    } = data;

    let astrologer_uni_id = "";
    let call_type = inputCallType;

    const history = await CallHistory.findOne({
      where: {
        uniqeid,
        status: { [Op.in]: ["queue", "request", "in-progress"] },
      },
    });

    const calls = await CallHistory.findOne({
      where: {
        uniqeid,
        status: { [Op.ne]: "completed" },
      },
      include: [{ model: User, as: "user", required: false }],
    });

    if (calls) {
      if (calls.call_type) {
        call_type = calls.call_type;
      }

      const currency = getCurrency(calls.user?.phone || "");
      const user_uni_id = calls.customer_uni_id;
      astrologer_uni_id = calls.astrologer_uni_id;

      const astroDetail = await getAstrologerById(astrologer_uni_id);

      // Architect service
      let is_architect_call_history = 0;
      let useAmount = 0;
      let wallet_balance = 0;
      
      // FIX: Calculate actual duration with proper timezone handling
      let actual_duration = 0;
      if (startTime && endTime) {
        // Both times are now in UTC, so we can calculate directly
        const start = new Date(startTime);
        const end = new Date(endTime);
        actual_duration = Math.floor((end - start) / 1000); // Duration in seconds
        
        // Debug logging
        console.log('Duration Debug:', {
          startTime: startTime,
          endTime: endTime,
          startUTC: start.toISOString(),
          endUTC: end.toISOString(),
          actual_duration: actual_duration,
          duration_seconds: actual_duration
        });
      } else {
        actual_duration = duration || 0; // Fallback to passed duration
      }
      
      let deductable_duration = actual_duration;

      if (calls.ref_id) {
        const approvedArchitectRequest = await getApprovedArchitectRequest(
          calls.ref_id
        );
        if (approvedArchitectRequest) {
          is_architect_call_history = 1;
        }
        const inProgressSchedule = await getInProgressSchedule(calls.ref_id);
        if (inProgressSchedule) {
          is_architect_call_history = 1;
        }
      }

      if (is_architect_call_history === 0) {
        const astroPrices = await getAstroPriceDataType(
          astrologer_uni_id,
          call_type,
          currency,
          calls.customer_uni_id
        );
        wallet_balance = await getTotalBalanceById(user_uni_id);

        const astroCharge = calls.charge || astroPrices.price;
        const astroChargeMinutes =
          calls.charge_minutes || astroPrices.time_in_minutes;

        // Calculate per-minute rate
        const perMinuteRate = astroCharge / astroChargeMinutes;

        // Calculate deductable duration
        if (constants.free_duration && constants.free_duration_allow < actual_duration) {
          deductable_duration = actual_duration - constants.free_duration;
          if (deductable_duration < 0) deductable_duration = 0;
        }

        // Calculate amount based on actual usage
        if (deductable_duration > 0) {
          if (constants.amount_deduct_minute_wise) {
            const minutes = deductMinuteCalculat(astroChargeMinutes, deductable_duration);
            useAmount = Math.round(perMinuteRate * minutes * 100) / 100;
          } else {
            useAmount = Math.round((perMinuteRate * deductable_duration / 60) * 100) / 100;
          }
        }

        // Ensure we don't deduct more than available balance
        if (wallet_balance > 0 && useAmount > 0 && useAmount > wallet_balance) {
          useAmount = wallet_balance;
        }
      }

      // Refund date setup
      const refund_call_days = constants.refund_call_days;
      const now = new Date();
      let refundValidDate = "";
      if (refund_call_days > 0) {
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + refund_call_days);
        refundValidDate = futureDate.toISOString().split("T")[0];
      }

      let result = {};
      const callHistoryData = {
        call_start: startTime,
        call_end: endTime,
        duration: actual_duration, // Use calculated actual duration
        recording: RecordingUrl,
        status: "completed",
        refund_valid_date: refundValidDate,
      };

      if (wallet_balance > 0 && useAmount > 0 && wallet_balance >= useAmount) {
        await CallHistory.update(callHistoryData, { where: { uniqeid } });
        await removeBusyStatus(astrologer_uni_id);

        const admin_percentage =
          astroDetail?.admin_percentage || constants.admin_percentage;

        const postAstroWalletHistoryData = {
          astrologer_uni_id,
          admin_percentage,
          user_uni_id,
          call_type,
          useAmount,
          duration: actual_duration, // Use calculated actual duration
          uniqeid,
        };
        await walletHistoryCreate(postAstroWalletHistoryData);

        result = { status: 1, msg: "successfully." };
      } else if (actual_duration > 0 && deductable_duration === 0) {
        // Free call (no deduction needed)
        await CallHistory.update(callHistoryData, { where: { uniqeid } });
        await removeBusyStatus(astrologer_uni_id);
        result = { status: 1, msg: "successfully." };
      } else {
        if (history) {
          await history.update({ status: "Declined(Insufficient Balance)" });
        }
        await removeBusyStatus(astrologer_uni_id);
        result = {
          status: 0,
          msg: "You Have Not Sufficient Balance Kindly Recharge",
        };
      }

      // Next call trigger
      if (astrologer_uni_id) {
        const waiting = await waitingCustomer(astrologer_uni_id);
        if (waiting?.call_type) {
          await startVideoCall(waiting, waiting.call_type);
        }
      }

      return result;
    } else {
      if (history) {
        await history.update({ status: "Invalid Call." });
      }
      await removeBusyStatus(astrologer_uni_id);
      return { status: 0, msg: "Invalid Call." };
    }
  } catch (err) {
    console.error("Error in callTransations:", err);
    return { status: 0, msg: "Something went wrong, please try again." };
  }
};

export const getInProgressSchedule = async (order_id) => {
  try {
    const thismodel = await SlotBooking.findOne({
      where: {
        status: {
          [Op.in]: ["in-progress"],
        },
        order_id: order_id,
      },
    });

    return thismodel;
  } catch (error) {
    console.error("Error in getInProgressSchedule:", error);
    throw error;
  }
};

export const deductMinuteCalculat = (per_minutes, seconds) => {
  let total_minutes = 0;
  per_minutes = per_minutes || 1;

  if (per_minutes > 0 && seconds > 0) {
    const per_minute_amt = seconds / 60;
    total_minutes = Math.ceil(per_minute_amt / per_minutes) * per_minutes;
  }

  return total_minutes;
};

export const walletHistoryCreate = async (data = {}) => {
  // Extract and set default values
  const astrologer_uni_id = data.astrologer_uni_id || 0;
  const admin_percentage = data.admin_percentage || 0;
  const user_uni_id = data.user_uni_id || 0;
  const useAmount = data.useAmount || 0;
  const duration = data.duration || 0;
  const call_type = data.call_type || "";
  const uniqeid = data.uniqeid || "";
  const astro_offer_call_amount = data.astro_offer_call_amount || 0;

  // Determine type message based on call_type
  let type_msg = "";
  switch (call_type) {
    case "call":
      type_msg = "Calling";
      break;
    case "video":
      type_msg = "Video Calling";
      break;
    case "callwithlive":
      type_msg = "Calling on Live";
      break;
    case "videocallwithlive":
      type_msg = "Video Calling on Live";
      break;
    case "privatecallwithlive":
      type_msg = "Private Calling on Live";
      break;
    case "privatevideocallwithlive":
      type_msg = "Private Video Calling on Live";
      break;
    case "chat":
      type_msg = "Chat";
      break;
    default:
      type_msg = "";
  }

  if (astro_offer_call_amount == 1) {
    // Get astrologer's currency details
    const currency_detail = await getCurrency(astrologer_uni_id, "all");
    const { currency_code, currency_symbol, exchange_rate } = currency_detail;

    // Create wallet history description
    const wallet_history_description_astro = `On offer ${type_msg} Amount For ${Math.floor(duration / 60)}:${duration % 60} Min. by admin`;
    const finaltds = 0;
    const astroAmount = useAmount - finaltds;

    // Prepare astrologer wallet history data
    const postAstroWalletHistoryData = {
      user_uni_id: astrologer_uni_id,
      transaction_code: "add_wallet_by_calling_by_admin",
      wallet_history_description: wallet_history_description_astro,
      transaction_amount: astroAmount,
      amount: astroAmount,
      main_type: "cr",
      admin_percentage: admin_percentage,
      admin_amount: 0,
      tds_amount: finaltds,
      offer_amount: 0,
      reference_id: uniqeid,
      status: 1,
      gateway_payment_id: "", // mene add kiya hai
      created_by: astrologer_uni_id,
      currency_code,
      currency_symbol,
      exchange_rate,
    };

    // Create wallet history record
    await Wallet.create(postAstroWalletHistoryData);
  } else {
    // Get user's currency details
    const currency_detail = await getCurrency(user_uni_id, "all");
    const { currency_code, currency_symbol, exchange_rate } = currency_detail;

    // Get user's gift balance
    const wallet_gift_balance = await getTotalBalanceGiftById(user_uni_id);

    // Create wallet history description
    const wallet_history_description = `${type_msg} Charge For Astrologer ${Math.floor(duration / 60)}:${duration % 60} Min.`;

    let deduct = 0;
    let offer_amount = 0;

    if (getConfig("offer_ammount_status")) {
      if (getConfig("main_balance_deduct_first") == 1) {
        const wallet_main_balance = await getTotalBalanceMainById(user_uni_id);

        if (useAmount <= wallet_main_balance) {
          deduct = useAmount;
        } else {
          deduct = useAmount;
          offer_amount = useAmount - deduct;
        }
      } else if (getConfig("balance_deduct_fifty_fifty") == 1) {
        const wallet_main_balance = await getTotalBalanceMainById(user_uni_id);

        const half_amount = Math.round((useAmount / 2) * 100) / 100;

        if (
          wallet_gift_balance >= half_amount &&
          wallet_main_balance >= half_amount
        ) {
          offer_amount = half_amount;
          deduct = half_amount;
        } else if (
          wallet_gift_balance >= half_amount &&
          wallet_main_balance < half_amount
        ) {
          deduct = wallet_main_balance;
          offer_amount = useAmount - deduct;
        } else if (
          wallet_gift_balance < half_amount &&
          wallet_main_balance >= half_amount
        ) {
          offer_amount = wallet_gift_balance;
          deduct = useAmount - offer_amount;
        } else {
          offer_amount = wallet_gift_balance;
          deduct = wallet_main_balance;
        }
      } else {
        if (useAmount <= wallet_gift_balance) {
          offer_amount = useAmount;
        } else {
          offer_amount = wallet_gift_balance;
          deduct = useAmount - offer_amount;
        }
      }
    } else {
      deduct = useAmount;
    }

    // Create wallet history for offer amount
    if (offer_amount > 0) {
      const inr_offer_amount = await convertToINR(offer_amount, exchange_rate);

      const postWalletHistoryData = {
        user_uni_id: user_uni_id,
        transaction_code: "remove_wallet_by_calling_offer",
        wallet_history_description,
        transaction_amount: inr_offer_amount,
        main_type: "dr",
        amount: inr_offer_amount,
        reference_id: uniqeid,
        created_by: user_uni_id,
        gateway_payment_id: "", // mene add kiya hai
        status: 1,
        offer_status: 1,
        currency_code,
        currency_symbol,
        exchange_rate,
      };
      await Wallet.create(postWalletHistoryData);
    }

    // Create wallet history for deducted amount
    if (deduct > 0) {
      const inr_deduct = await convertToINR(deduct, exchange_rate);

      const postWalletHistoryData = {
        user_uni_id: user_uni_id,
        transaction_code: "remove_wallet_by_calling",
        wallet_history_description,
        transaction_amount: inr_deduct,
        main_type: "dr",
        amount: inr_deduct,
        reference_id: uniqeid,
        created_by: user_uni_id,
        status: 1,
        gateway_payment_id: "", // mene add kiya hai
        currency_code,
        currency_symbol,
        exchange_rate,
      };
      await Wallet.create(postWalletHistoryData);
    }
    // Create wallet history for astrologer
    const wallet_history_descriptionAdd = `${type_msg} Amount For User ${Math.floor(duration / 60)}:${duration % 60} Min.`;

    let admin_amount = 0;
    if (admin_percentage && deduct) {
      admin_amount = (admin_percentage / 100) * deduct;
    }

    const astrPartAmount = Math.round((deduct - admin_amount) * 100) / 100;

    const tds = getConfig("tds");
    const finaltds =
      tds && tds > 0 ? Math.round((tds / 100) * astrPartAmount * 100) / 100 : 0;

    const astroAmount = astrPartAmount - finaltds;

    // Get astrologer's currency details
    const astro_currency_detail = await getCurrency(astrologer_uni_id, "all");

    const {
      currency_code: astro_currency_code,
      currency_symbol: astro_currency_symbol,
      exchange_rate: astro_exchange_rate,
    } = astro_currency_detail;

    // Convert amounts to INR
    const inr_astroAmount = await convertToINR(astroAmount, exchange_rate);
    const inr_admin_amount = await convertToINR(admin_amount, exchange_rate);
    const inr_finaltds = await convertToINR(finaltds, exchange_rate);
    const inr_offer_amount = await convertToINR(offer_amount, exchange_rate);

    // Prepare astrologer wallet history data
    const postAstroWalletHistoryData = {
      user_uni_id: astrologer_uni_id,
      transaction_code: "add_wallet_by_calling",
      wallet_history_description: wallet_history_descriptionAdd,
      transaction_amount: inr_astroAmount,
      amount: inr_astroAmount,
      main_type: "cr",
      admin_percentage,
      admin_amount: inr_admin_amount,
      tds_amount: inr_finaltds,
      offer_amount: inr_offer_amount,
      reference_id: uniqeid,
      status: 1,
      gateway_payment_id: "", // mene add kiya hai
      created_by: astrologer_uni_id,
      currency_code: astro_currency_code,
      currency_symbol: astro_currency_symbol,
      exchange_rate: astro_exchange_rate,
    };

    // Create astrologer wallet history record
    await Wallet.create(postAstroWalletHistoryData);
  }
};

export const convertToINR = async (amount, exchange_rate) => {
  if (exchange_rate <= 0) {
    exchange_rate = 1;
  }

  const convertedAmount = Math.round(amount * exchange_rate * 100) / 100;
  return convertedAmount;
};