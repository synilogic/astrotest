import dotenv from "dotenv";
import fs from "fs";
import path, { join } from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { formatDateTime, dobFormatForApp, tobFormatForApp, getUserAssets, } from "./dateTimeFormat.js";
import sequelize from "../_config/db.js";
import dayjs from "dayjs";
import moment from "moment-timezone";
import numberShorten from "./numberShorten.js";
import { constants, imagePath, ROLE_IDS, CURRENCY } from "../_config/constants.js";
import { getConfig } from "../configStore.js";
dotenv.config();

import {
  checkFirebaseCustomAuthToken, generateAgoraRtcToken, getCustomerById, getCurrency,
  getTotalBalanceById, isFirstUser, sendNotification, 
 } from "./common.js";

 import { 
  checkCallToken, getAstroPriceDataType, alreadySentRequestUniqeid,
   getCustomerQueueList, remainingChatTime, removeBusyStatus, waitingCustomer,
   availableMinuteCalculat, waitingTime,
   exotelCustomerWhitelistCurl, callTransations, new_sequence_code
  } from "./communicationHelper.js"


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
// import DiscountAssign from "../_models/astrologer_discount_assigns.js";
// import { checkFirebaseCustomAuthToken } from "./checkFirebaseCustomAuthToken.js";

const startingSequence = 98;
const customerstartingSequence = 200;
const filePath = path.resolve("astro-sequence.json");
const CustomerfilePath = path.resolve("customer-sequence.json");



export const startVideoCall = async (array, call_type) => {
  let charge_for_clevertap = 0;
  let result = {};


  const firebase_custom_auth_token = await checkFirebaseCustomAuthToken(
    array.user_uni_id
  );

  if (firebase_custom_auth_token) {
    let in_app_voice_call = 0;
    if (array.is_inapp_voice_call !== undefined) {
      if (array.is_inapp_voice_call == 1) {
        in_app_voice_call = array.is_inapp_voice_call;
      }
    }
    const customer = await getCustomerById(array.user_uni_id);

    const astrologer = await Astrologer.findOne({
      where: { astrologer_uni_id: array.astrologer_uni_id },
      include: [
        {
          model: User,
          as: "user",
          required: true,
          where: { user_uni_id: array.astrologer_uni_id },
        },
      ],
    });

 

    const currency_detail = await getCurrency(customer.user.phone, "all");
    const currency_code = currency_detail.currency_code;
    const currency_symbol = currency_detail.currency_symbol;
    const exchange_rate = currency_detail.exchange_rate;

    const astrologer_price = await getAstroPriceDataType(
      array.astrologer_uni_id,
      call_type,
      currency_code,
      array.user_uni_id
    );

      
    const user_wallet_amt = await getTotalBalanceById(array.user_uni_id);

    let call_by_cronjob = 0;
    if (array.call_by_cronjob !== undefined) {
      if (array.call_by_cronjob && array.call_by_cronjob != null) {
        call_by_cronjob = array.call_by_cronjob;
      }
    }

    

    if (!array.uniqeid || array.uniqeid == null) {
      array.uniqeid = await alreadySentRequestUniqeid(
        array.user_uni_id,
        array.astrologer_uni_id
      );
    }


    let astrologer_uni_id = "";
    let callHistory = null;
    let uniqeid = "";
    let is_queue_request = 0;
    let my_queue_number = 0;
    let is_chat_in_progress = 0;
    let is_call_in_progress = 0;
    let is_video_call_in_progress = 0;
    let intake_status = 0;

    if (array.uniqeid) {
      uniqeid = array.uniqeid;
      callHistory = await CallHistory.findOne({ where: { uniqeid: uniqeid } });

      const waitings_number = await getCustomerQueueList(array.user_uni_id);
      
      if (waitings_number && waitings_number.length > 0) {
        for (const waitings_num of waitings_number) {
          if (waitings_num.uniqeid == uniqeid) {
            my_queue_number = waitings_num.my_queue_number;
            break;
          }
        }
      }

      if (callHistory) {
        if (
          ["queue", "queue_request", "request"].includes(callHistory.status)
        ) {
          is_queue_request = 1;
          if (callHistory.is_inapp_voice_call !== undefined) {
            in_app_voice_call = callHistory.is_inapp_voice_call;
          }
        }

        if (
          callHistory.call_type == "chat" &&
          ["in-progress", "request"].includes(callHistory.status)
        ) {
          is_chat_in_progress = 1;
        } else if (
          callHistory.call_type == "video" &&
          ["in-progress", "request"].includes(callHistory.status)
        ) {
          is_video_call_in_progress = 1;
        } else {
          if (
            callHistory.is_inapp_voice_call &&
            callHistory.is_inapp_voice_call == 1
          ) {
            if (
              callHistory.call_type == "call" &&
              ["in-progress", "request"].includes(callHistory.status)
            ) {
              is_call_in_progress = 1;
              in_app_voice_call = callHistory.is_inapp_voice_call;
            }
          } else if (
            callHistory.call_type == "call" &&
            callHistory.status == "in-progress"
          ) {
            is_call_in_progress = 1;
          }
        }
      }
    }

    if (is_chat_in_progress == 1) {
      if (call_type == "chat") {
        const remaining_result = await remainingChatTime(uniqeid);
        if (remaining_result.remaining_time_in_second > 0) {
          const minutes = remaining_result.minutes;
          const second = remaining_result.remaining_time_in_second;
          const senddata = {
            minutes: minutes,
            second: second,
            uniqeid: uniqeid,
            name: astrologer.user.name,
          };
          result = {
            status: 1,
            join_status: 2,
            intake_status: intake_status,
            my_queue_number: 0,
            is_chat_in_progress: is_chat_in_progress,
            data: senddata,
            msg: "You are rejoined the chat",
          };
        } else {
          const duration = callHistory.waiting_time;
          if (duration && duration > 0) {
            const call_end = new Date(
              new Date(callHistory.call_start).getTime() + duration * 1000
            )
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");
            const sendData = {
              uniqeid: callHistory.uniqeid,
              startTime: callHistory.call_start,
              endTime: call_end,
              duration: duration,
              call_type: "chat",
            };
            result = await callTransations(sendData);
          } else {
            if (callHistory) {
              astrologer_uni_id = callHistory.astrologer_uni_id;
              await callHistory.update({ status: "Invalid Call." });
            }
            await removeBusyStatus(astrologer_uni_id);
            if (astrologer_uni_id) {
              const waitingCustomerData =
                await waitingCustomer(astrologer_uni_id);
              if (waitingCustomerData && waitingCustomerData.call_type) {
                await startVideoCall(
                  waitingCustomerData,
                  waitingCustomerData.call_type
                );
              }
            }
            result = {
              status: 0,
              msg: "Something is wrong please try again",
            };
          }
        }
      } else {
        result = {
          status: 0,
          msg: "You are already in on going chat please wait till it finish.",
        };
      }
    } else if (is_video_call_in_progress == 1) {
      if (call_type == "video") {
        const remaining_result = await remainingChatTime(uniqeid);
        if (remaining_result.remaining_time_in_second > 0) {
          const minutes = remaining_result.minutes;
          const second = remaining_result.remaining_time_in_second;
          const senddata = {
            minutes: minutes,
            second: second,
            uniqeid: uniqeid,
            name: astrologer.user.name,
          };
          result = {
            status: 1,
            join_status: 2,
            intake_status: intake_status,
            my_queue_number: 0,
            is_video_call_in_progress: is_video_call_in_progress,
            data: senddata,
            msg: "You are rejoined the video call",
          };
        } else {
          const duration = callHistory.waiting_time;
          if (duration && duration > 0) {
            const call_end = new Date(
              new Date(callHistory.call_start).getTime() + duration * 1000
            )
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");
            const sendData = {
              uniqeid: callHistory.uniqeid,
              startTime: callHistory.call_start,
              endTime: call_end,
              duration: duration,
              call_type: "video",
            };
            result = await callTransations(sendData);
          } else {
            if (callHistory) {
              astrologer_uni_id = callHistory.astrologer_uni_id;
              await callHistory.update({ status: "Invalid Video Call." });
            }
            await removeBusyStatus(astrologer_uni_id);
            if (astrologer_uni_id) {
              const waitingCustomerData =
                await waitingCustomer(astrologer_uni_id);
              if (waitingCustomerData && waitingCustomerData.call_type) {
                await startVideoCall(
                  waitingCustomerData,
                  waitingCustomerData.call_type
                );
              }
            }
            result = {
              status: 0,
              msg: "Something is wrong please try again",
            };
          }
        }
      } else {
        result = {
          status: 0,
          msg: "You are already in on going video call please wait till it finish.",
        };
      }
    } else if (is_call_in_progress == 1) {
      if (in_app_voice_call && in_app_voice_call == 1) {
        if (call_type == "call") {
          const remaining_result = await remainingChatTime(uniqeid);
          if (remaining_result.remaining_time_in_second > 0) {
            const minutes = remaining_result.minutes;
            const second = remaining_result.remaining_time_in_second;
            const senddata = {
              minutes: minutes,
              second: second,
              uniqeid: uniqeid,
              name: astrologer.user.name,
            };
            result = {
              status: 1,
              join_status: 2,
              intake_status: intake_status,
              my_queue_number: 0,
              is_call_in_progress: is_call_in_progress,
              data: senddata,
              msg: "You are rejoined the voice call",
            };
          } else {
            const duration = callHistory.waiting_time;
            if (duration && duration > 0) {
              const call_end = new Date(
                new Date(callHistory.call_start).getTime() + duration * 1000
              )
                .toISOString()
                .slice(0, 19)
                .replace("T", " ");
              const sendData = {
                uniqeid: callHistory.uniqeid,
                startTime: callHistory.call_start,
                endTime: call_end,
                duration: duration,
                call_type: "call",
              };
              result = await callTransations(sendData);
            } else {
              if (callHistory) {
                astrologer_uni_id = callHistory.astrologer_uni_id;
                await callHistory.update({ status: "Invalid Call." });
              }
              await removeBusyStatus(astrologer_uni_id);
              if (astrologer_uni_id) {
                const waitingCustomerData =
                  await waitingCustomer(astrologer_uni_id);
                if (waitingCustomerData && waitingCustomerData.call_type) {
                  await startVideoCall(
                    waitingCustomerData,
                    waitingCustomerData.call_type
                  );
                }
              }
              result = {
                status: 0,
                msg: "Something is wrong please try again",
              };
            }
          }
        } else {
          result = {
            status: 0,
            msg: "You are already in on going voice call please wait till it finish.",
          };
        }
      } else {
        result = {
          status: 0,
          msg: "You are already in on going voice call please wait till it finish.",
        };
      }
    } else {

      if ( !callHistory || (callHistory && callHistory.status != "Session Expired") ) {

        if ( !(await alreadySentRequestUniqeid( array.user_uni_id, array.astrologer_uni_id )) || is_queue_request) {
     
          let astro_online_status = 0;
          if (astrologer.online_status == 1) {
            if (astrologer.call_status == 1 && call_type == "call") {
              astro_online_status = 1;
            } else if (astrologer.chat_status == 1 && call_type == "chat") {
              astro_online_status = 1;
            } else if (astrologer.video_status == 1 && call_type == "video") {
              astro_online_status = 1;
            }
          }

          if (astro_online_status == 1) {
            if (astrologer_price.price && astrologer_price.price > 0) {
              let charge_for_clevertap = 0;
              let charge_minutes = astrologer_price.time_in_minutes;

              if (astrologer_price.price <= user_wallet_amt) {
                const astroPrice = astrologer_price.price;
                charge_for_clevertap = astroPrice;

                const minutes = await availableMinuteCalculat(
                  astroPrice,
                  charge_minutes,
                  user_wallet_amt,
                  array.user_uni_id,
                  call_type,
                  uniqeid,
                  array.astrologer_uni_id
                );

                const second = minutes * 60;
                const getWaitingTime = await waitingTime(
                  array.astrologer_uni_id
                );

               

                const ivr_count = constants.ivr_count;
                const ivr_after_seconds = constants.ivr_after_seconds;
                const request_waiting = constants.request_waiting;

                // const waiting_for_request = formatDateTime(
                //   new Date(Date.now() + request_waiting * 1000)
                // );

                function formatDateTimeToMySQL(date) {
                  return date.toISOString().slice(0, 19).replace("T", " ");
                }

                const waiting_for_request = formatDateTimeToMySQL(
                  new Date(Date.now() + request_waiting * 1000)
                );

                let is_review = call_type === "call" ? 0 : 1;


                if (!is_queue_request) {
                  if (call_type === "chat") {
                    uniqeid = await new_sequence_code("CHAT");
                  } else if (call_type === "call") {
                    uniqeid = await new_sequence_code("CALL");
                  } else if (call_type === "video") {
                    uniqeid = await new_sequence_code("VIDEO");
                  }
                

                 const status_online_data = {
 uniqeid,
 customer_uni_id: array.user_uni_id,
 astrologer_uni_id: array.astrologer_uni_id,
 charge: parseFloat(astroPrice) || 0,
 // original_astro_charge: parseFloat(astroPrice) || 0, // Commented out - column doesn't exist in database
 charge_minutes,
  duration: 0,
  status: "queue",
  call_type,
  is_review,
  order_date: new Date().toISOString().split("T")[0],
  waiting_time: second,
  is_inapp_voice_call: in_app_voice_call,
  currency_code,
  currency_symbol,
  exchange_rate: parseFloat(exchange_rate) || 1.0,
  created_at: new Date(),
  updated_at: new Date(),
};

                     
                
                  callHistory = await CallHistory.create(status_online_data);
                 
                }

                let is_token = 1;
                let senddata = {};


                if (getWaitingTime == 0 || (getWaitingTime > 0 && is_queue_request && my_queue_number == 1)) {

                  if (call_type === "call") {
                    if (in_app_voice_call && in_app_voice_call == 1) {
                      const curent_status = callHistory.status;
                      if (
                        (getWaitingTime == 0 && curent_status == "request") ||
                        (getWaitingTime > 0 &&
                          is_queue_request &&
                          curent_status == "queue_request" &&
                          my_queue_number == 1) ||
                        getWaitingTime == 0
                      ) {
                        const arry = {
                          uniqeid: uniqeid,
                          user_uni_id: array.user_uni_id,
                          user_id: customer.id,
                        };
                        const agoraTokenGen = await generateAgoraRtcToken(arry);
                        if (agoraTokenGen.token) {
                          senddata.token = agoraTokenGen.token;
                        } else {
                          is_token = 0;
                        }
                      }
                      if (getWaitingTime == 0 && senddata.token) {
                        await callHistory.update({
                          token: senddata.token,
                          status: "request",
                          waiting_time: second,
                          waiting_for_request: waiting_for_request,
                        });
                      }
                    } else {
                      const check_call_token = await checkCallToken(
                        callHistory.uniqeid
                      );
                      if (check_call_token) {
                        // Note: Cache locking requires a Redis or similar implementation in Node.js
                        const customerNumber = customer.user.phone;
                        const astroPhone = astrologer.user.phone;
                        const custoWhite =
                          await exotelCustomerWhitelistCurl(customerNumber);
                        const astroWhite =
                          await exotelCustomerWhitelistCurl(astroPhone);
                        const CallReq = await exotelCallRequestCurl(
                          astroPhone,
                          customerNumber,
                          second
                        );
                        if (CallReq.Call && CallReq.Call.Sid) {
                          senddata.token = CallReq.Call.Sid;
                          await callHistory.update({
                            token: CallReq.Call.Sid,
                            status: "in-progress",
                            call_start: moment().toISOString(), // FIX: Use moment() like in videoCall.js
                            waiting_time: second,
                          });
                        } else {
                          is_token = 0;
                        }
                      }
                    }
                  }

                  if (getWaitingTime == 0 && call_type === "chat") {
                    await callHistory.update({
                      status: "request",
                      waiting_time: second,
                      waiting_for_request: waiting_for_request,
                    });
                  }

                  if (getWaitingTime == 0 && call_type === "video") {
                    const arry = {
                      uniqeid: uniqeid,
                      user_uni_id: array.user_uni_id,
                      user_id: customer.id,
                    };
                    const agoraTokenGen = await generateAgoraRtcToken(arry);
                    if (agoraTokenGen.token) {
                      senddata.token = agoraTokenGen.token;
                      await callHistory.update({
                        token: agoraTokenGen.token,
                        status: "request",
                        waiting_time: second,
                        waiting_for_request: waiting_for_request,
                      });
                    } else {
                      is_token = 0;
                    }
                  }
                }

                

                if (is_token) {
                 
                  if (callHistory.uniqeid) {
                    await Astrologer.update(
                      { busy_status: "1" },
                      { where: { astrologer_uni_id: array.astrologer_uni_id } }
                    );
                    senddata.minutes = minutes;
                    senddata.second = second;
                    senddata.uniqeid = uniqeid;
                    senddata.name = astrologer.user.name;

                    if ( ["chat", "video"].includes(call_type) || (call_type === "call" && in_app_voice_call == 1)) {
                      const curent_status = callHistory.status;
                      if (
                        (getWaitingTime == 0 && curent_status == "request") ||
                        (getWaitingTime > 0 &&
                          is_queue_request &&
                          curent_status == "queue_request" &&
                          my_queue_number == 1)
                      ) {
                        const saveData = {
                          status: "request",
                          waiting_time: second,
                          is_review: is_review,
                          waiting_for_request: waiting_for_request,
                          ivr_count: ivr_count,
                          ivr_start_from: moment().add(ivr_after_seconds, 'seconds').toISOString(), // FIX: Use moment()
                        };
                        if (
                          in_app_voice_call == 1 &&
                          senddata.token &&
                          call_type == "call"
                        ) {
                          saveData.token = senddata.token;
                        }
                        await callHistory.update(saveData);

                        if (astrologer.user.user_fcm_token) {
                          const notification_desc =
                            call_type == "chat"
                              ? "You Have a Chat Request ..."
                              : call_type == "video"
                                ? "You Have a Video Call Request ..."
                                : "You Have a Voice Call Request ...";
                          const astroNotify = {
                            title: customer.user.name,
                            description: notification_desc,
                            chunk: [astrologer.user.user_fcm_token],
                            type: call_type,
                            uniqueId: uniqeid || "",
                            customerUniId: customer.customer_uni_id || "",
                            customerName: customer.user.name || "",
                            customerImage: customer.customer_img,
                            channelName: getConfig("company_name"),
                            user_uni_id: array.user_uni_id,
                            astrologer_uni_id: array.astrologer_uni_id,
                            duration: second,
                            start_time: moment().toISOString(), // FIX: Use moment() like in videoCall.js
                            notification_id: callHistory.id,
                          };
                          await sendNotification(astroNotify);
                        }
                      }

                      if (
                        (getWaitingTime == 0 && curent_status == "queue") ||
                        (getWaitingTime > 0 &&
                          is_queue_request &&
                          curent_status == "queue" &&
                          my_queue_number == 1)
                      ) {
                        const saveData = {
                          status: "queue_request",
                          waiting_time: second,
                          is_review: is_review,
                          waiting_for_request: waiting_for_request,
                          ivr_count: ivr_count,
                          ivr_start_from: moment().add(ivr_after_seconds, 'seconds').toISOString(), // FIX: Use moment()
                        };

                        await callHistory.update(saveData);

                        if (customer.user.user_fcm_token) {
                          const notification_desc =
                            call_type == "chat"
                              ? "Available For Your Chat ..."
                              : call_type == "video"
                                ? "Available For Your Video Call ..."
                                : "Available For Your Voice Call ...";
                          const customerNotify = {
                            title: astrologer.display_name,
                            description: notification_desc,
                            chunk: [customer.user.user_fcm_token],
                            type: call_type,
                            channelName: getConfig("company_name"),
                            user_uni_id: array.user_uni_id,
                            astrologer_uni_id: array.astrologer_uni_id,
                            duration: second,
                            start_time: moment().toISOString(), // FIX: Use moment() like in videoCall.js
                            notification_id: callHistory.id,
                          };
                          await sendNotification(customerNotify);
                        }
                      }
                    }

                    if (!is_queue_request && callHistory.status == "queue") {
                      if (astrologer.user.user_fcm_token) {
                        const notification_desc =
                          call_type == "chat"
                            ? "Join chat queue."
                            : call_type == "video"
                              ? "Join video call queue."
                              : "Join voice call queue.";
                        const astroNotify = {
                          title: customer.user.name,
                          description: notification_desc,
                          chunk: [astrologer.user.user_fcm_token],
                          type: "android",
                          uniqueId: uniqeid || "",
                          customerUniId: customer.customer_uni_id || "",
                          customerName: customer.user.name || "",
                          customerImage: customer.customer_img,
                          channelName: getConfig("company_name"),
                          user_uni_id: array.user_uni_id,
                          astrologer_uni_id: array.astrologer_uni_id,
                          duration: second,
                          start_time: new Date().toISOString().slice(0, 19).replace("T", " "),
                          notification_id: callHistory.id,
                        };
                        await sendNotification(astroNotify);
                      }
                    }

                    const is_virtual_astrologer = astrologer.is_virtual;
                    if (is_virtual_astrologer == 1) {
                      const virtualReqUpdateData = {
                        call_start: moment().toISOString(), // FIX: Use moment() like in videoCall.js
                        order_date: moment().format('YYYY-MM-DD'),
                        status: "in-progress",
                      };
                      await callHistory.update(virtualReqUpdateData);
                    }

                    if (getWaitingTime) {
                      let msg = "";
                      let status = 0;
                      let join_status = 0;
                      const check_current_status = callHistory.status;

                      if (callHistory.call_type == "chat") {
                        if (
                          ["queue", "queue_request"].includes(
                            check_current_status
                          ) &&
                          is_queue_request
                        ) {
                          msg = `You are already in the chat queue. Please wait, ${astrologer.display_name} will answer you shortly.`;
                          status = 1;
                          join_status = 0;
                        } else if (
                          check_current_status == "request" &&
                          is_queue_request
                        ) {
                          msg = `Your chat request has been sent, ${astrologer.display_name} will join you shortly.`;
                          status = 1;
                          join_status = 1;
                        } else if (check_current_status == "queue") {
                          msg = `Your chat request has been successfully booked. ${astrologer.display_name} will answer you within ${minutesToReadableTime(getWaitingTime)}`;
                          status = 1;
                          join_status = 0;
                          intake_status = 1;
                        }
                      } else if (callHistory.call_type == "video") {
                        if (
                          ["queue", "queue_request"].includes(
                            check_current_status
                          ) &&
                          is_queue_request
                        ) {
                          msg = `You are already in the video call queue. Please wait, ${astrologer.display_name} will answer you shortly.`;
                          status = 1;
                          join_status = 0;
                        } else if (
                          check_current_status == "request" &&
                          is_queue_request
                        ) {
                          msg = `Your video call request has been sent, ${astrologer.display_name} will join you shortly.`;
                          status = 1;
                          join_status = 1;
                        } else if (check_current_status == "queue") {
                          msg = `Your video call request has been successfully booked. ${astrologer.display_name} will answer you within ${minutesToReadableTime(getWaitingTime)}`;
                          status = 1;
                          join_status = 0;
                          intake_status = 1;
                        }
                      } else if (callHistory.call_type == "call") {
                        if (in_app_voice_call && in_app_voice_call == 1) {
                          if (
                            ["queue", "queue_request"].includes(
                              check_current_status
                            ) &&
                            is_queue_request
                          ) {
                            msg = `You are already in the voice call queue. Please wait, ${astrologer.display_name} will answer you shortly.`;
                            status = 1;
                            join_status = 0;
                          } else if (
                            check_current_status == "request" &&
                            is_queue_request
                          ) {
                            msg = `Your voice call request has been sent, ${astrologer.display_name} will join you shortly.`;
                            status = 1;
                            join_status = 1;
                          } else if (check_current_status == "queue") {
                            msg = `Your voice call request has been successfully booked. ${astrologer.display_name} will answer you within ${minutesToReadableTime(getWaitingTime)}`;
                            status = 1;
                            join_status = 0;
                            intake_status = 1;
                          }
                        } else {
                          if (
                            check_current_status == "queue" &&
                            is_queue_request
                          ) {
                            msg = `You are already in the call queue. Please wait, ${astrologer.display_name} will answer you shortly. You will receive a call from: ${getConfig("exotel_caller_id")}`;
                            status = 1;
                            join_status = 0;
                          } else if (check_current_status == "queue") {
                            msg = `Your voice call request has been successfully booked. ${astrologer.display_name} will answer you within ${minutesToReadableTime(getWaitingTime)}. You will receive a call from: ${getConfig("exotel_caller_id")}`;
                            status = 1;
                            join_status = 0;
                            intake_status = 1;
                          }
                        }
                      }

                      result = {
                        status: status,
                        join_status: join_status,
                        intake_status: intake_status,
                        my_queue_number: my_queue_number,
                        data: senddata,
                        msg: msg,
                      };
                    } else {
                      let msg =
                        call_type == "chat"
                          ? `Your chat request has been successfully booked. ${astrologer.display_name} will answer you soon.`
                          : call_type == "video"
                            ? `Your video call request has been successfully booked. ${astrologer.display_name} will answer you soon.`
                            : call_type == "call"
                              ? in_app_voice_call
                                ? `Your voice call request has been successfully booked. ${astrologer.display_name} will answer you soon.`
                                : `Your voice call request has been successfully booked. ${astrologer.display_name} will answer you soon. You will receive a call from: ${getConfig("exotel_caller_id")}`
                              : `Your request has been successfully booked. ${astrologer.display_name} will answer you soon.`;
                      const join_status = 1;
                      result = {
                        status: 1,
                        join_status: join_status,
                        intake_status: intake_status,
                        my_queue_number: my_queue_number,
                        data: senddata,
                        msg: msg,
                      };
                    }
                  } else {
                    await callHistory.update({
                      status: "Declined(Token Cannot Generate)",
                    });
                    await removeBusyStatus(array.astrologer_uni_id);
                    result = {
                      status: 0,
                      msg: "Oops! Cannot generate token. Please try again",
                    };
                  }
                } else {

                  await callHistory.update({
                    status: "Declined(Invalid Unique Id)",
                  });
                  await removeBusyStatus(array.astrologer_uni_id);
                  result = {
                    status: 0,
                    msg: "Something Went wrong. Try Again",
                  };
                }
              } else {
                result = {
                  status: 0,
                  error_code: 102,
                  msg: "You Have Not Sufficent 3 Balance Kindly Recharge",
                };
              }
            } else {
              result = {
                status: 0,
                msg: "Astrologer not available for this service",
              };
            }
          } else {
            result = {
              status: 0,
              msg: `Astrologer is offline for ${call_type}`,
            };
          }
        } else {
          if (astrologer_uni_id) {
            const waitingCustomerData = await waitingCustomer(astrologer_uni_id);
            if (waitingCustomerData && waitingCustomerData.call_type) {
              await startVideoCall(
                waitingCustomerData,
                waitingCustomerData.call_type
              );
            }
          }
          result = {
            status: 0,
            msg: "You are already in queue please wait or cancel queue from queue list.",
          };
        }
      } else {
        if (astrologer_uni_id) {
          const waitingCustomerData = await waitingCustomer(astrologer_uni_id);

          if (waitingCustomerData && waitingCustomerData.call_type) {
            await startVideoCall(waitingCustomerData, waitingCustomerData.call_type);
          }
        }
        result = {
          status: 0,
          msg: "You missed this Session (Expired).",
        };
      }
    }
  } else {
    result = {
      status: 0,
      msg: "Please update your app and then re-login",
    };
  }

  charge_for_clevertap = parseFloat(charge_for_clevertap);
  result.charge = charge_for_clevertap;
  return result;
};