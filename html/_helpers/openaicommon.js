

import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import Joi from 'joi';
import db from '../_config/db.js';
import '../_models/index.js';
import moment  from 'moment-timezone';
import SettingModel from '../_models/settings.js';
import OpenAIProfile from '../_models/open_ai_profiles.js';
import Customer from '../_models/customers.js';
import User from '../_models/users.js';
import Offer from '../_models/offers.js';   
import OpenAIPrediction from '../_models/open_ai_predictions.js';
import VedicAstro from '../_helpers/VedicAstro11.js';
import { checkUserApiKey ,getTotalBalanceById,getCustomerById} from '../_helpers/common.js';
import { getConfig } from '../configStore.js';
import { constants, imagePath } from "../_config/constants.js";
import open_ai from "../_helpers/OpenAI.js";
import Wallet from "../_models/wallet.js";
import RazorpayApi from "../_helpers/services/RazorpayApi.js";
const AIpretartingSequence = 651;
const AIStartingSequence = 660;
// const filePath = path.resolve("aipre-sequence.json");
import fs from 'fs';
import path from 'path';

// Example default values — make sure these are properly defined elsewhere

import { Op ,Sequelize} from 'sequelize';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

// Enable custom formats
dayjs.extend(customParseFormat);
import { formatDateTime } from "../_helpers/dateTimeFormat.js";
import { fileURLToPath } from 'url';
// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'aipr-sequence.json');
// export async function generateAIPRUniId() {
//   let sequence = AIpretartingSequence;

//   try {
//     if (fs.existsSync(filePath)) {
//       const rawData = fs.readFileSync(filePath, 'utf8');
//       const data = JSON.parse(rawData);

//       if (data && typeof data.sequence === 'number') {
//         sequence = data.sequence < AIpretartingSequence
//           ? AIpretartingSequence
//           : data.sequence;
//       }
//     }

//     const padded = String(sequence).padStart(4, '0'); // e.g., 0301
//     const uniqueId = `AIPR${padded}`;

//     // Save the next sequence
//     fs.writeFileSync(
//       filePath,
//       JSON.stringify({ sequence: sequence + 1 }, null, 2),
//       'utf8'
//     );

//     return uniqueId;
//   } catch (error) {
//     console.error('Error generating AIPR ID:', error);
//     throw error;
//   }
// }


export async function generateAIPRUniId() {
  let sequence = AIStartingSequence;
  try {
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(rawData);
      if (data && typeof data.sequence === 'number') {
        sequence = data.sequence < AIStartingSequence
          ? AIStartingSequence
          : data.sequence;
      }
    }
    const padded = String(sequence).padStart(4, '0'); // e.g., 0301
    const uniqueId = `AIPR${padded}`;
    // Save the next sequence
    fs.writeFileSync(
      filePath,
      JSON.stringify({ sequence: sequence + 1 }, null, 2),
      'utf8'
    );
    return uniqueId;
  } catch (error) {
    console.error('Error generating AIPR ID:', error);
    throw error;
  }
}

export function formatTime(timeStr) {
  const formats = ['H:mm:ss', 'H:mm', 'h:mm A', 'h:mm a', 'hh:mm A', 'hh:mm a'];

  for (const format of formats) {
    const parsed = dayjs(timeStr, format, true); // strict mode
    if (parsed.isValid()) {
      return parsed.format('HH:mm');
    }
  }

  return false;
}
async function getSettingValue(setting_name) {
  const setting = await SettingModel.findOne({ where: { setting_name } });
  return setting?.setting_value || null;
}

export async function openAIPredictionCalculation(request) {
  let openAiPredictionPrice = Number(await getSettingValue("open_ai_prediction_price")) || 0;
  console.log("openAiPredictionPrice222", openAiPredictionPrice);

  if (!openAiPredictionPrice || isNaN(openAiPredictionPrice)) {
    return { status: 0, data: "", msg: "AI prediction price is invalid" };
  }

  const userAmount = await getTotalBalanceById(request.user_uni_id);
  console.log("userAmount", userAmount);

  const curDate = dayjs();
  let msg = "";

  // 🔒 Sanitize offer code
  const offerCode = typeof request.offer_code === "string" ? request.offer_code.trim() : "";
  let offerData = null;

  // ✅ Safe query to avoid Sequelize error
  if (offerCode) {
    offerData = await Offer.findOne({
      where: {
        offer_code: offerCode,
        status: 1,
      },
    });
  }

  // 📉 Pricing setup
  let remaining_offer_count = 0;
  let max_offer_count = 0;
  let is_offer_applied = 0;
  let actual_price = 0;
  let subtotal = openAiPredictionPrice;

  const discountData = await checkOpenAIDiscountAllowed(request.user_uni_id);
  console.log("discountData", discountData);

  if (discountData?.discounted_price) {
    actual_price = openAiPredictionPrice;
    subtotal = discountData.discounted_price;
    remaining_offer_count = discountData.remaining_offer_count;
    max_offer_count = discountData.max_offer_count;
    is_offer_applied = 1;
  }

  let wallet_amount = 0;
  let payable_amount = 0;
  let reference_amount = 0;
  let offer_amount = 0;
  let finalamount = 0;

  if (subtotal > 0) {
    // 🧾 Handle offer logic only if no discount applied already
    if (is_offer_applied === 0 && offerCode && offerData) {
      if (offerCode === offerData.offer_code) {
        const validFrom = dayjs(offerData.offer_validity_from);
        const validTo = dayjs(offerData.offer_validity_to);

        if (curDate.isAfter(validFrom) && curDate.isBefore(validTo)) {
          if (subtotal > offerData.minimum_order_amount) {
            offer_amount =
              offerData.offer_category === "amount"
                ? offerData.discount_amount
                : (subtotal * offerData.discount_amount) / 100;
          } else {
            return {
              status: 0,
              msg: `Minimum Order value ${offerData.minimum_order_amount}`,
            };
          }

          if (offerData.max_order_amount > subtotal) {
            // Already calculated above, repeat to be sure
            offer_amount =
              offerData.offer_category === "amount"
                ? offerData.discount_amount
                : (subtotal * offerData.discount_amount) / 100;
          } else {
            return {
              status: 0,
              msg: `Maximum Order value ${offerData.max_order_amount}`,
            };
          }
        } else {
          msg = "Coupon code expired";
        }
      } else {
        msg = "Invalid Coupon code";
      }
    } else if (offerCode) {
      msg = "Invalid Coupon code";
    }

    finalamount = subtotal - reference_amount - offer_amount;
  }

  // 💰 Wallet logic
  const currentUserAmount = Number(userAmount) || 0;

  if (request.wallet_check == 1) {
    if (currentUserAmount >= finalamount) {
      wallet_amount = finalamount;
      payable_amount = 0;
    } else if (currentUserAmount > 0) {
      wallet_amount = currentUserAmount;
      payable_amount = finalamount - currentUserAmount;
    } else {
      wallet_amount = 0;
      payable_amount = finalamount;
    }
  } else {
    wallet_amount = 0;
    payable_amount = finalamount;
  }

  // 💸 GST calculation
  const recharge_gst_percent = Number(await getSettingValue("gst")) || 0;
  let recharge_gst_value = 0;

  if (payable_amount > 0 && recharge_gst_percent > 0) {
    recharge_gst_value = parseFloat(((payable_amount * recharge_gst_percent) / 100).toFixed(2));
    payable_amount += recharge_gst_value;
  }

  const data = {
    open_ai_prediction_price: Number(subtotal.toFixed(2)),
    open_ai_prediction_actual_price: Number(actual_price.toFixed(2)),
    remaining_offer_count,
    max_offer_count,
    is_offer_applied,
    offer_ammount: Number(offer_amount.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    finalamount: Number(finalamount.toFixed(2)),
    wallet_amount: Number(wallet_amount.toFixed(2)),
    recharge_gst_percent,
    recharge_gst_value,
    payable_amount: Number(payable_amount.toFixed(2)),
    my_wallet_amount: Number(currentUserAmount.toFixed(2)),
  };

  if (payable_amount === 0) {
    if (!msg) msg = "Success";
    return { status: 1, data, msg };
  } else {
    if (!msg) msg = "Insufficient Wallet Balance";
    return { status: 1, error_code: 102, data, msg };
  }
}


export async function checkOpenAIDiscountAllowed(user_uni_id) {
  if (!user_uni_id) {
    return {};
  }

  const discountedPrice = Number(await getConfig('open_ai_prediction_discounted_price')) || 0;
  const allowedCount = Number(await getConfig('open_ai_prediction_discount_allowed')) || 0;

  const recordCount = await OpenAIPrediction.count({ where: { user_uni_id } });

  if (allowedCount > 0 && recordCount < allowedCount + 2) {
    return {
      discounted_price: discountedPrice,
      remaining_offer_count: (allowedCount + 2) - recordCount,
      max_offer_count: allowedCount,
    };
  }

  return {};
}

export async function openAIPredictionPurchase(req) {

 
        try {
            // Get configuration values
            let open_ai_prediction_price = await getConfig('open_ai_prediction_price');
        
            
            if (!open_ai_prediction_price || !open_ai_prediction_price.value || 
                isNaN(open_ai_prediction_price.value)) {
                open_ai_prediction_price = 0;
            } else {
                open_ai_prediction_price = parseFloat(open_ai_prediction_price.value);
            }

            const user_uni_id = req.user_uni_id;
            const asked_question = req.question;

            const char_count = asked_question.length;
            
            // Get minimum character count from config
            let min_char_count_config = await getConfig('open_ai_min_char_count');
           
            const min_char_count = min_char_count_config ? 
                parseInt(min_char_count_config.value) : 10;

            if (char_count >= min_char_count) {
                let open_ai_profile_id = 0;
                const customer1 = await getCustomerById(user_uni_id);

                if (customer1) {
                    if (customer1.birth_date && customer1.birth_time && 
                        customer1.longitude && customer1.latitude) {
                        
                        const result = await openAIPredictionCalculation(req);
                         console.log("result openaipredicationcalculation",result);
                        const order_id = await generateAIPRUniId();

                      //  return order_id;
                        // const order_id = 'SHIV1234';
                        
                        const date = moment();
                          // console.log("result",result);
                        let where_from = 'web';
                        let product_order_payment_status = '1';

                        

                        if (result.status == 1) {
                            if (result.data.payable_amount == 0) {
                                let cust_data = await checkOpenAIProfile(user_uni_id);
                                
                                if (!cust_data) {
                                    cust_data = {
                                        name: customer1.name,
                                        gender: customer1.gender,
                                        dob: customer1.birth_date,
                                        tob: customer1.birth_time,
                                        pob: customer1.birth_place,
                                        lat: customer1.latitude,
                                        lon: customer1.longitude,
                                        lang: 'English',
                                    };
                                } else {
                                    if (cust_data.id) {
                                        open_ai_profile_id = cust_data.id;
                                    }
                                 }
                                      
                                 let customer = typeof cust_data?.toJSON === 'function' ? cust_data.toJSON() : cust_data;

                                        const cust_data_for_kundali = {
                                          name: customer.name,
                                          gender: customer.gender,
                                          dob: customer.dob,
                                          tob: customer.tob,
                                          pob: customer.pob,
                                          lat: customer.lat,
                                          lon: customer.lon,
                                          lang: customer.lang || 'en',
                                        };
                       const kundali = await generateVedicAstroKundaliChart(cust_data_for_kundali);
                                  //  console.log("rrfe",kundali);
                                  
                              if (kundali !== false) {
                                    const formatted_cust_data = `
                                        Name         :${cust_data.name} 

                                        Gender       :${cust_data.gender} 

                                        Date of Birth:${cust_data.dob} 

                                        Time of Birth:${cust_data.tob} 

                                        Place of Birth:${cust_data.pob} 

                                        Latitude     :${cust_data.lat} 

                                        Longitude    :${cust_data.lon} 

                                        `;

                                    const str_lang = cust_data.lang ? ` in ${cust_data.lang}` : ' in English';
                                    const astrology_api_response = JSON.stringify(kundali);
                                         
                                     
                                    let open_ai_system_prompt = await getConfig('open_ai_system_prompt') || '';
                                    let open_ai_user_prompt = await getConfig('open_ai_user_prompt') || '';

                                    const openAiAstrologerPromptVar = {
                                        '#ASKED_QUESTION#': asked_question || '',
                                        '#KUNDALI#': astrology_api_response || '',
                                        '#USERDETAILS#': formatted_cust_data || '',
                                        '#USER_LANGUAGE#': str_lang || '',
                                    };

                                    // Replace placeholders in prompts
                                    Object.keys(openAiAstrologerPromptVar).forEach(key => {
                                        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                        const regex = new RegExp(escapedKey, 'g');

                                        open_ai_system_prompt = open_ai_system_prompt.replace(regex, openAiAstrologerPromptVar[key]);
                                        open_ai_user_prompt = open_ai_user_prompt.replace(regex, openAiAstrologerPromptVar[key]);
                                    });

                                    const query = {
                                        model: "gpt-4o",
                                        messages: [
                                            {
                                                role: "system",
                                                content: open_ai_system_prompt
                                            },
                                            {
                                                role: "user",
                                                content: open_ai_user_prompt
                                            }
                                        ],
                                        temperature: 0.9,
                                        max_tokens: 2048
                                    };
                                          

                                          //  console.log("query",query);
                                   // const openai = await open_ai.completions(query);
                                     const openai = {
                                            choices: [
                                              {
                                                message: {
                                                  content: `Sure, here's a dummy response for your query: "${query.messages[1]?.content || 'No question'}".`
                                                }
                                              }
                                            ]
                                          };

                                        
                                                                            //  const data = await openai.chat.completions.create(query);
                                      // console.log("data ",openai);
                                     
                                    const open_ai_response = openai.choices[0]?.message?.content || '';
                                    //console.log("open_ai_response",open_ai_response);
                                           // process.exit();
                                    if (open_ai_response) {
                                       console.log("here");
                                        let msg = "Payment Successfully";
                                        let payment_gateway_status = 0;
                                        let wallet_status = 1;
                                        let gateway_order_id = '';
                                        let payment_gateway_resp = '';
                                         console.log("result.data.payable_amount",result.data.payable_amount);
                                        if (result.data.payable_amount && result.data.payable_amount > 0) {
                                            product_order_payment_status = '0';
                                            let payment_method = '';
                                            
                                            // Get payment gateway config
                                            const payment_gateway_config = await getConfig('payment_gateway');
                                            
                                              console.log("payment_gateway_config",payment_gateway_config);
                                                  
                                            if (payment_gateway_config && payment_gateway_config.value) {
                                                const user = await User.findOne({
                                                    where: { user_uni_id: user_uni_id }
                                                });
                                                    
                                               if (req.payment_method) {
                                                    where_from = 'app';
                                                      
                                                    if (req.payment_method == 'razorpay') {
                                                        payment_method = 'razorpay';
                                                        const razorpay_id_config = await getConfig(
                                                            'razorpay_id' 
                                                        );
                                                        const logo_config = await getConfig(
                                                           'logo' 
                                                        );
                                                        
                                                        const razorpay_id = razorpay_id_config ? razorpay_id_config.value : '';
                                                        const logo = logo_config ? logo_config.value : '';
                                                        
                                                        const arrry = { 
                                                            amount: result.data.payable_amount, 
                                                            currency: 'INR' 
                                                        };
                                                        
                                                        const razorpayApi = new RazorpayApi();
                                                        const response = await razorpayApi.createOrderId(arrry);
                                                        
                                                        if (response.status) {
                                                            const arry = {
                                                                phone: user.phone,
                                                                amount: result.data.payable_amount,
                                                                razorpay_id: razorpay_id,
                                                                user_uni_id: user_uni_id,
                                                                logo: logo,
                                                                email: user.email || '',
                                                                name: user.name || '',
                                                                order_id: response.orderId
                                                            };
                                                            
                                                            payment_gateway_resp = arry;
                                                            gateway_order_id = response.orderId;
                                                        } else {
                                                            return {
                                                                status: 0,
                                                                msg: "Failed please try again",
                                                            };
                                                        }
                                                    } else if (req.payment_method == 'CCAvenue') {
                                                        payment_method = 'CCAvenue';
                                                        gateway_order_id = generateNDigitRandomNumber(15);
                                                        
                                                        const ccavenue_merchant_id = await Config.findOne({
                                                            where: { key: 'ccavenue_merchant_id' }
                                                        });
                                                        const ccavenue_currency = await Config.findOne({
                                                            where: { key: 'ccavenue_currency' }
                                                        });
                                                        const ccavenue_language = await Config.findOne({
                                                            where: { key: 'ccavenue_language' }
                                                        });
                                                         
                                                        const parameters = {
                                                            merchant_id: ccavenue_merchant_id ? ccavenue_merchant_id.value : '',
                                                            currency: ccavenue_currency ? ccavenue_currency.value : '',
                                                            redirect_url: process.env.APP_URL + "/paymentresponseccavenueapp",
                                                            cancel_url: process.env.APP_URL + "/paymentresponseccavenueapp",
                                                            language: ccavenue_language ? ccavenue_language.value : '',
                                                            order_id: gateway_order_id,
                                                            amount: result.data.payable_amount,
                                                            billing_name: user.name || '',
                                                            billing_tel: '',
                                                            billing_email: '',
                                                            merchant_param1: user_uni_id,
                                                        };
                                                        payment_gateway_resp = parameters;
                                                    } else if (req.payment_method == 'PhonePe') {
                                                        payment_method = 'PhonePe';
                                                        gateway_order_id = "ORD" + generateNDigitRandomNumber(12);
                                                        
                                                        const parameters = {
                                                            merchantTransactionId: gateway_order_id,
                                                            merchantUserId: user_uni_id,
                                                            amount: result.data.payable_amount,
                                                            redirectUrl: process.env.APP_URL + "/paymentresponsephonepeapp",
                                                            callbackUrl: process.env.APP_URL + "/paymentresponsephonepeapp",
                                                            redirectUrlWeb: process.env.APP_URL + "/paymentresponsephonepeappwebview",
                                                            callbackUrlWeb: process.env.APP_URL + "/paymentresponsephonepeappwebview",
                                                            mobileNumber: user.phone,
                                                            is_updated: req.is_updated || 0,
                                                        };
                                                        payment_gateway_resp = parameters;
                                                    } else if (req.payment_method == 'Cashfree') {
                                                        payment_method = 'Cashfree';
                                                        const customerData = await Customer.findOne({
                                                            include: [{
                                                                model: User,
                                                                where: { user_uni_id: user_uni_id }
                                                            }],
                                                            where: { customer_uni_id: user_uni_id }
                                                        });
                                                        
                                                        let cust_phone = customerData?.phone || '';
                                                        if (cust_phone) {
                                                            cust_phone = cust_phone.slice(-10);
                                                        }
                                                        
                                                        gateway_order_id = "order_" + generateNDigitRandomNumber(8);
                                                        const parameters = {
                                                            gateway_order_id: gateway_order_id,
                                                            amount: result.data.payable_amount,
                                                            returnUrl: process.env.APP_URL + "/paymentresponsecashfreeapp",
                                                            notifyUrl: process.env.APP_URL + "/paymentresponsecashfreeapp",
                                                            customer_id: user_uni_id,
                                                            customer_phone: cust_phone,
                                                            customer_name: customerData?.name || '',
                                                            customer_email: customerData?.email || '',
                                                        };
                                                        payment_gateway_resp = parameters;
                                                    } else if (req.payment_method == 'Payu') {
                                                        payment_method = 'Payu';
                                                        const customerData = await Customer.findOne({
                                                            include: [{
                                                                model: User,
                                                                where: { user_uni_id: user_uni_id }
                                                            }],
                                                            where: { customer_uni_id: user_uni_id }
                                                        });
                                                        
                                                        let cust_phone = customerData?.phone || '';
                                                        if (cust_phone) {
                                                            cust_phone = cust_phone.slice(-10);
                                                        }
                                                        
                                                        gateway_order_id = "ORD" + generateNDigitRandomNumber(8);
                                                        const parameters = {
                                                            gateway_order_id: gateway_order_id,
                                                            amount: result.data.payable_amount,
                                                            successURL: process.env.APP_URL + "/paymentresponsepayuapp",
                                                            failureURL: process.env.APP_URL + "/paymentresponsepayuapp",
                                                            customer_id: user_uni_id,
                                                            customer_phone: cust_phone,
                                                            customer_name: customerData?.name || '',
                                                            customer_email: customerData?.email || '',
                                                            description: 'Open AI Prediction Purchase',
                                                            is_updated: req.is_updated || 0,
                                                        };
                                                        payment_gateway_resp = parameters;
                                                    } else {
                                                        return {
                                                            status: 0,
                                                            msg: "No Payment Gateway Available",
                                                        };
                                                    }
                                                } else {
                                                    // Handle default payment gateway logic
                                                    if (payment_gateway_config.value == 'Razorpay') {
                                                        // Same Razorpay logic as above
                                                        payment_method = 'razorpay';
                                                        // ... (repeat razorpay logic)
                                                    } else if (payment_gateway_config.value == 'CCAvenue') {
                                                        // Same CCAvenue logic as above
                                                        payment_method = 'CCAvenue';
                                                        // ... (repeat CCAvenue logic)
                                                    } else if (payment_gateway_config.value == 'PhonePe') {
                                                        // Same PhonePe logic as above
                                                        payment_method = 'PhonePe';
                                                        // ... (repeat PhonePe logic)
                                                    } else if (payment_gateway_config.value == 'Cashfree') {
                                                        // Same Cashfree logic as above
                                                        payment_method = 'Cashfree';
                                                        // ... (repeat Cashfree logic)
                                                    } else {
                                                        return {
                                                            status: 0,
                                                            msg: "No Payment Gateway Available",
                                                        };
                                                    }
                                                }
                                            } else {
                                                return {
                                                    status: 0,
                                                    msg: "No Payment Gateway Available",
                                                };
                                            }

                                            msg = "Payment Gateway Request";
                                            payment_gateway_status = 1;
                                            wallet_status = 0;
                                            
                                            const recharge_amount = Math.round(
                                                (result.data.payable_amount - result.data.recharge_gst_value) * 100
                                            ) / 100;
                                            
                                            const cutomerwalletamtadd = {
                                                reference_id: order_id,
                                                gateway_order_id: gateway_order_id,
                                                user_uni_id: user_uni_id,
                                                transaction_code: 'add_wallet',
                                                wallet_history_description: `Wallet Add Amount by Customer Recharge on Sanjeevini Purchase # RS. ${recharge_amount}`,
                                                transaction_amount: result.data.payable_amount,
                                                amount: recharge_amount,
                                                main_type: 'cr',
                                                gst_amount: result.data.recharge_gst_value,
                                                status: wallet_status,
                                                offer_status: 0,
                                                payment_method: payment_method,
                                                where_from: where_from,
                                            };
                                            
                                            await Wallet.create(cutomerwalletamtadd);
                                        }

                                        const open_ai_prediction = {
                                            order_id: order_id,
                                            user_uni_id: user_uni_id,
                                            astrology_api_response: astrology_api_response,
                                            question: asked_question,
                                            open_ai_response: open_ai_response,
                                            message_type: 'text',
                                            total_amount: result.data.finalamount,
                                            open_ai_profile_id: open_ai_profile_id,
                                            status: product_order_payment_status,
                                        };
                                        
                                        await OpenAIPrediction.create(open_ai_prediction);

                                        // if (payment_gateway_status == 0) {
                                        //     // Session equivalent - you might want to use Redis or similar
                                        //     req.order_msg = 'Order placed successfully';
                                        // }
                                          
                                        if (result.data.finalamount > 0) {
                                            const customerwallet = {
                                                user_uni_id: user_uni_id,
                                                reference_id: order_id,
                                                gateway_order_id: gateway_order_id,
                                                transaction_code: 'remove_wallet_by_purchase_open_ai_prediction',
                                                wallet_history_description: `Remove Amount by Purchase Open AI Prediction # RS. ${result.data.finalamount}`,
                                                transaction_amount: result.data.finalamount,
                                                amount: result.data.finalamount,
                                                main_type: 'dr',
                                                offer_code: req.offer_code,
                                                status: wallet_status
                                            };
                                            
                                            await Wallet.create(customerwallet);
                                        }

                                        let data = '';
                                        if (result.data) {
                                            data = result.data;
                                        }

                                        if (payment_gateway_status == 0) {
                                            // User answer return start
                                            let question_data = [];
                                            let answer_data = [];

                                            const resp = await OpenAIPrediction.findOne({
                                                include: [
                                                    {
                                                        model: User,
                                                        attributes: ['name'],
                                                        as: 'user'
                                                    },
                                                    {
                                                        model: Customer,
                                                        attributes: ['customer_img'],
                                                        as: 'customer'
                                                    }
                                                ],
                                                where: { order_id: order_id }
                                            });

                                          //  console.log("wallet resp",resp);
                                                //console.log("resp",resp);
                                                   console.log("customer_img,sss",resp.customer.customer_img);
                                            if (resp) {
                                                // Get image paths from config
                                               const baseurl="http://localhost:8006";
                                                const customer_image_path = '/uploads/customers/';
                                                const default_bot_image_path =  '/images/bot.png';
                                                const default_customer_image_path =  '/images/customer.png';

                                                const bot_img = process.env.APP_URL + default_bot_image_path;
                                                let customer_img = '';
                                                
                                                if (resp.customer?.customer_img && 
                                                    fs.existsSync(path.join(process.cwd(), 'public', customer_image_path, resp.customer.customer_img))) {

                                                    
                                                    customer_img = customer_image_path + resp.customer.customer_img;
                                                    console.log("customer_img",customer_img);
                                                } else {
                                                    customer_img = 'http://localhost:8007/assets/img/customer.png';
;
                                                }

                                                if (resp.question) {
                                                    question_data = {
                                                        user_uni_id: resp.user_uni_id,
                                                        user_name: resp.user?.name || '',
                                                        user_image_url: customer_img,
                                                        message: resp.question,
                                                        message_type: resp.message_type,
                                                        status: resp.status,
                                                        created_at: resp.created_at,
                                                    };
                                                }

                                                if (resp.open_ai_response) {
                                                    answer_data = {
                                                        user_uni_id: 'bot',
                                                        user_name: 'Open AI',
                                                        user_image_url: bot_img,
                                                        message: resp.open_ai_response,
                                                        message_type: resp.message_type,
                                                        status: resp.status,
                                                        created_at: resp.created_at,
                                                    };
                                                }
                                            }
                                            // User answer return end

                                            return {
                                                status: 1,
                                                is_cust_data_incomplete: 0,
                                                order_id: order_id,
                                                question_data: question_data,
                                                answer_data: answer_data,
                                                payment_gateway_status: payment_gateway_status,
                                                msg: msg,
                                                data: data,
                                            };
                                        } else {
                                            return {
                                                status: 1,
                                                is_cust_data_incomplete: 0,
                                                order_id: order_id,
                                                payment_gateway_status: payment_gateway_status,
                                                payment_gateway: payment_gateway_resp,
                                                msg: msg,
                                                data: data,
                                            };
                                        }
                                    } else {
                                        return {
                                            status: 0,
                                            is_cust_data_incomplete: 0,
                                            order_id: "",
                                            msg: "Something went wrong please try again1",
                                        };
                                    }
                                } else {
                                    return {
                                        status: 0,
                                        is_cust_data_incomplete: 0,
                                        order_id: "",
                                        msg: "Something went wrong please try again2",
                                    };
                                }
                            } else {
                                return {
                                    status: 0,
                                    error_code: 102,
                                    is_cust_data_incomplete: 0,
                                    order_id: "",
                                    msg: "Insufficient Wallet Balance",
                                };
                            }
                        } else {
                            let msg = "Failed please try again";
                            if (result.msg) {
                                msg = result.msg;
                            }
                            return {
                                status: 0,
                                is_cust_data_incomplete: 0,
                                order_id: "",
                                msg: msg,
                            };
                        }
                    } else {
                        return {
                            status: 0,
                            is_cust_data_incomplete: 1,
                            order_id: "",
                            msg: 'Incomplete Customer Data',
                        };
                    }
                } else {
                    return {
                        status: 0,
                        is_cust_data_incomplete: 0,
                        order_id: "",
                        msg: 'Invalid Customer',
                    };
                }
            } else {
                return {
                    status: 0,
                    is_cust_data_incomplete: 0,
                    order_id: "",
                    msg: `Message must be greater than ${min_char_count} character`,
                };
            }
        } catch (error) {
            console.error('Error in openAIPredictionPurchase:', error);
            return {
                status: 0,
                is_cust_data_incomplete: 0,
                order_id: "",
                msg: 'Internal server error',
            };
        }
 }

export async function openAIPredictionPurchaseNew(req) {
          
    const cust_data_for_kundali = {
                                name: 'mmm',
                                gender: 'male',
                                // dob: '22/09/2000',
                                dob: '2000-01-02',
                                tob: '14:45',
                                pob: 'kota',
                                lat: '24.73',
                                lon: '76.4',
                                lang: 'en',
                              };
                        console.log("cust_data_for_kundali",cust_data_for_kundali);
                        
                        
                      const kundali = await generateVedicAstroKundaliChart(cust_data_for_kundali);
                          console.log("rrfe",kundali);

                          return kundali;
                        //process.exit();
  }


export async function checkOpenAIProfile(user_uni_id, open_ai_profile_id = '') {
 
  let result = null;


  try {
    if (open_ai_profile_id) {
      const profile = await OpenAIProfile.findOne({
        where: {
          customer_uni_id: user_uni_id,
          id: open_ai_profile_id,
        },
      });
        
      if (profile) result = profile;

    } else {
      const selectedProfile = await OpenAIProfile.findOne({
        where: {
          customer_uni_id: user_uni_id,
          [Op.or]: [
            { is_selected: 1 },
            { is_self_profile: 1 },
          ],
        },
        order: [
          ['is_selected', 'DESC'],
          ['is_self_profile', 'DESC'],
        ],
      });
          
      if (selectedProfile) {
        result = selectedProfile;
      } else {

      
        const prediction = await OpenAIPrediction.findOne({
          attributes: [
            'open_ai_predictions.*',
            [Sequelize.col('user->customer.customer_img'), 'customer_img'],
            [Sequelize.col('user.name'), 'user_name'],
          ],
          include: [
            {
              model: User,
              as: 'user',
              attributes: [],
              required: false,
              include: [
                {
                  model: Customer,
                  as: 'customer',
                  attributes: [],
                  required: false,
                },
              ],
            },
          ],
          where: {
            user_uni_id: user_uni_id,
            user_data: {
              [Op.and]: [
                { [Op.not]: null },
                { [Op.ne]: '' },
              ],
            },
          },
          order: [['id', 'DESC']],
          raw: true,
        });
          
        if (prediction && prediction.user_data) {
 
          const userData = JSON.parse(prediction.user_data);
          userData.name = prediction.user_name; 
          result = userData;
          
          const existingProfile = await OpenAIProfile.findOne({
            where: { customer_uni_id: user_uni_id },
          });
          
          if (!existingProfile) {
            const profileData = {
              customer_uni_id: user_uni_id,
              name: userData.name,
              gender: userData.gender,
              dob: userData.dob,
              tob: userData.tob,
              pob: userData.pob,
              lat: userData.lat,
              lon: userData.lon,
              lang: userData.lang || 'English',
              is_selected: 1,
              is_self_profile: 1,
              status: 1,
            };
                
            await OpenAIProfile.create(profileData);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in checkOpenAIProfile:", error);
  }

  return result;
}


export async function addOpenAIProfile(request){

 
   const user_uni_id = request.user_uni_id;
  const lang = request.lang || 'en';

  let is_selected = 0;

  if (request.is_selected == 1) {
         console.log("in con");
    is_selected = 1;

    // Unselect all previous profiles
    await OpenAIProfile.update(
      { is_selected: 0 },
      {
        where: {
          customer_uni_id: user_uni_id,
          is_selected: 1,
        },
      }
    );
  }
 
  // Create new OpenAI Profile
  const open_ai_profile_data = {
    customer_uni_id: user_uni_id,
    name: request.name,
    gender: request.gender,
    dob: request.dob,
    tob: request.tob,
    pob: request.pob,
    lat: request.lat,
    lon: request.lon,
    lang,
    is_selected,
  };

  const newProfile = await OpenAIProfile.create(open_ai_profile_data);
   
  const open_ai_profile_id = newProfile?.id || 0;

  // If selected profile, generate kundali + AI prediction
  if (is_selected === 1) {
    const cust_data = {
      name: request.name,
      gender: request.gender,
      dob: request.dob,
      tob: request.tob,
      pob: request.pob,
      lat: request.lat,
      lon: request.lon,
      lang,
    };
          
    const userKundali = await generateVedicAstroKundaliChart(cust_data);
      
      
    if (userKundali?.chartImage) {
      const user_data = JSON.stringify(cust_data);
      const astrology_api_response = JSON.stringify(userKundali);
      const open_ai_response = userKundali.chartImage;
      const order_id = await generateAIPRUniId();
          
      // Insert chart image message
      await OpenAIPrediction.create({
        order_id,
        user_uni_id,
        astrology_api_response,
        question: '',
        open_ai_response,
        message_type: 'svg',
        user_data,
        total_amount: 0,
        open_ai_profile_id,
        status: 1,
      });
       
      // Insert bot message
      await OpenAIPrediction.create({
        order_id,
        user_uni_id,
        astrology_api_response: '',
        question: '',
        open_ai_response: constants.default_bot_message || "Hello! I'm here to help you.",
        message_type: 'text',
        user_data,
        total_amount: 0,
        open_ai_profile_id,
        status: 1,
      });
    }
  }
        

  // Return final profile result
  const result = await checkOpenAIProfile(user_uni_id, newProfile.id);

  return result;
}

async function generateVedicAstroKundaliChart(userData) {
        
  const customer = { ...userData };
    if (!customer.dob || !customer.tob || !customer.lon || !customer.lat) {
    return false;
  }
 // console.log("cus",customer);
            
   let dob = dayjs(customer.dob, 'YYYY-MM-DD', true);
  if (!dob.isValid()) throw new Error("Invalid DOB format");
  dob = dob.format('DD/MM/YYYY');

  

  let tob = formatTime(customer.tob);

  const lat = customer.lat;
  const lon = customer.lon;
  const tz = customer.tz || '5.5';

  const div = 'D1';
  // const color = '%23ff850b3d';
  const color = '#ff850b3d';
  const style = 'north';
  const fontSize = '12';
  const fontStyle = 'Nunito';
  const colorfulPlanets = true;
  const size = '400';
  const stroke = '2';
  const lang = 'en';
  const fromat= 'base64';
  const transit_date ='22/01/2022';
       
  const vedicAstro = new VedicAstro();
    // console.log( "values sends",dob, tob, lat, lon, tz,
    //   div, color, style,
    //   fontSize, fontStyle,
    //   colorfulPlanets, size, stroke, lang,fromat,transit_date);
  try {
    const chartImage = await vedicAstro.chartImage(
   {dob, tob, lat, lon, tz,
      div, color, style,
      fontSize, fontStyle,
      colorfulPlanets, size, stroke, lang,transit_date,fromat}
    );
  //  console.log("Kundali API Response:", chartImage);
    if (!chartImage || chartImage.message === "Internal server error" || chartImage.message) {
      return { chartImage: '' };
    }
//    console.log("Kundali API Response:", chartImage);
    return { chartImage };
  } catch (error) {
    console.error("generateVedicAstroKundaliChart error:", error);
    return { chartImage: '' };
  }
}
  
function asset(path) {
  const BASE_URL = constants.base_url || 'https://yourdomain.com';
  return `${BASE_URL}/${path}`;
}


export async function openAIPredictionList(request) {
   
 
  const user_uni_id = request.user_uni_id;
  let open_ai_profile_id = 0;

  // 🛠️ Check existing profile or create new one if missing 
  const existingProfile = await checkOpenAIProfile(user_uni_id);
 //console.log("existingProfile",existingProfile);
  if (!existingProfile) {
    const customer = await getCustomerById(user_uni_id);
     //  console.log("customaaaaaernnn",customer.user.name);
    if (customer && customer.birth_date && customer.birth_time && customer.longitude && customer.latitude) {
      const custData = {
        name:     customer.user.name,
        gender:   customer.gender,
        dob:      customer.birth_date,
        tob:      customer.birth_time,
        pob:      customer.birth_place,
        lat:      customer.latitude,
        lon:      customer.longitude,
        lang:     'English',
      };

      const userKundali = await generateVedicAstroKundaliChart(custData);
          
   //  console.log("userKundali",userKundali);
      if (userKundali?.chartImage) {
        const profileData = {
          customer_uni_id: user_uni_id,
          ...custData,
          is_selected:     1,
          is_self_profile: 1,
          status:          1,
        };
        const newProfile = await OpenAIProfile.create(profileData);
        if (newProfile?.id) open_ai_profile_id = newProfile.id;                               

        const user_data = JSON.stringify(custData);
        const astrology_api_response = JSON.stringify(userKundali);
        
        const order_id = await generateAIPRUniId();

        // SVG message
        await OpenAIPrediction.create({
          order_id,
          user_uni_id,
          astrology_api_response,
          question: '',
          open_ai_response: userKundali.chartImage,
          message_type: 'svg',
          user_data,
          total_amount: 0,
          open_ai_profile_id,
          status: 1,
        });

        // Bot text message
        await OpenAIPrediction.create({
          order_id,
          user_uni_id,
          astrology_api_response: '',
          question: '',
          open_ai_response: constants.default_bot_message,
          message_type: 'text',
          user_data,
          total_amount: 0,
          open_ai_profile_id,
          status: 1,
        });
      }
    }
  } else if (existingProfile.id) {
    open_ai_profile_id = existingProfile.id;
  }

  // 📜 Build query for predictions
  const query = {
    where: { user_uni_id },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name'],
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['customer_img'],
        }],
      },
    ],
    order: [['id', 'DESC']],
    raw: true,
  };
  if (open_ai_profile_id > 0) {
    query.where.open_ai_profile_id = open_ai_profile_id;
  }

  // 🔢 Pagination
    const page = request.page && parseInt(request.page) > 0 ? parseInt(request.page) : 1;
    console.log("page1",page);
    const page_limit = constants.open_ai_chat_api_page_limit;
    query.limit = page_limit;
    query.offset = (page - 1) * page_limit;
          console.log("query1",query);
  const rawPredictions = await OpenAIPrediction.findAll(query);
    // console.log("hello",rawPredictions);
  // 🧩 Format result for frontend
  const results = [];
 const botImg = asset(imagePath.default_bot_image_path);
  const customerImgPath = asset(imagePath.customer_image_path);
  const fallbackCustImg = `http://localhost:8000/uploads/customers/24bdaf1c-0a14-402b-afe9-3b919d6f1bc4.jpg`;

  for (const row of rawPredictions) {
    const custImg = row['user.customer.customer_img'];
    const userImageUrl = custImg ? `${customerImgPath}/${custImg}` : fallbackCustImg;

    if (row.open_ai_response) {
      results.push({
        user_uni_id: 'bot',
        user_name: 'Open AI',
        user_image_url: botImg,
        message: row.open_ai_response,
        message_type: row.message_type,
        status: row.status,
        created_at: row.created_at,
      });
    }
    if (row.question) {
      results.push({
        user_uni_id: row.user_uni_id,
        user_name: row['user.name'],
        user_image_url: userImageUrl, 
        message: row.question,
        message_type: row.message_type,
        status: row.status,
        created_at: row.created_at,
      });
    }
  }

  return results;
}

export async function getOpenAIProfile(request){
  const user_uni_id = request.user_uni_id;
  const open_ai_profile_id = request.open_ai_profile_id ?? ''; 
  const result = await checkOpenAIProfile(user_uni_id, open_ai_profile_id);

  return result;
}

export const tobFormatForApp = (date) => {
  if (!date) return '';
  const formatted = dayjs(date, ['HH:mm:ss', 'HH:mm']).format('hh:mm A');
  return formatted === 'Invalid Date' ? '' : formatted;
};

export const dobFormatForApp = (date) => {
  if (!date || date === '0000-00-00') return '';
  const formatted = dayjs(date).format('DD/MM/YYYY');
  return formatted === 'Invalid Date' ? '' : formatted;
};

export async function selectOpenAIProfile({ user_uni_id, open_ai_profile_id }) {
  // 1. Find the requested profile
  const profile = await OpenAIProfile.findOne({
    where: {
      customer_uni_id: user_uni_id,
      id: open_ai_profile_id
    }
  });

  // 2. If it exists, clear any previously selected, then mark this one selected
  if (profile) {
    await OpenAIProfile.update(
      { is_selected: 0 },
      {
        where: {
          customer_uni_id: user_uni_id,
          is_selected: 1
        }
      }
    );

    await profile.update({ is_selected: 1 });
  }

  // 3. Fetch and return the (possibly updated) profile data
  const result = await checkOpenAIProfile(user_uni_id, open_ai_profile_id);
  return result;
}


  export async function deleteOpenAIProfile({ user_uni_id, open_ai_profile_id }) {
  // 1. Find the profile to delete
  const profile = await OpenAIProfile.findOne({
    where: {
      customer_uni_id: user_uni_id,
      id: open_ai_profile_id,
    }
  });

  // 2. If not found
  if (!profile) {
    return {
      status: 0,
      data: '',
      msg: 'No data found',
    };
  }

  // 3. Prevent deleting self‑profile
  if (profile.is_self_profile === 1) {
    return {
      status: 0,
      data: '',
      msg: 'Deleting the default profile is not allowed.',
    };
  }

  // 4. If this profile was selected, re‑select the self‑profile
  if (profile.is_selected === 1) {
    await OpenAIProfile.update(
      { is_selected: 1 },
      {
        where: {
          customer_uni_id: user_uni_id,
          is_self_profile: 1
        }
      }
    );
  }

  // 5. Capture the data to return, then delete
  const deletedData = profile.get({ plain: true });
  await profile.destroy();

  return {
    status: 1,
    data: deletedData,
    msg: 'Deleted successfully',
  };
}

export async function updateOpenAIProfile({ value }) {
    const {
        user_uni_id,
        open_ai_profile_id = 0,
        name,
        gender,
        dob,
        tob,
        pob,
        lat,
        lon,
        lang = 'English',
        is_selected
    } = value;

    const cust_data = {
        name,
        gender,
        dob,
        tob,
        pob,
        lat,
        lon,
        lang
    };

    // Call external API to generate Kundali chart
    const userKundali = await generateVedicAstroKundaliChart(cust_data);

    if (userKundali && userKundali.chartImage) {
        const user_data = JSON.stringify(cust_data);
        const astrology_api_response = JSON.stringify(userKundali);
        const open_ai_response = userKundali.chartImage;

        // Generate Order ID
        const order_id = await generateAIPRUniId();

        const open_ai_prediction_add_data_svg = {
            order_id,
            user_uni_id,
            astrology_api_response,
            question: '',
            open_ai_response,
            message_type: 'svg',
            user_data,
            total_amount: 0,
            open_ai_profile_id,
            status: 1,
        };

        await OpenAIPrediction.create(open_ai_prediction_add_data_svg);

        const open_ai_prediction_add_data_text = {
            order_id,
            user_uni_id,
            astrology_api_response: '',
            question: '',
            open_ai_response: constants.default_bot_message,
            message_type: 'text',
            user_data,
            total_amount: 0,
            open_ai_profile_id,
            status: 1,
        };

        await OpenAIPrediction.create(open_ai_prediction_add_data_text);

        if (open_ai_profile_id) {
            const openAiProfile = await OpenAIProfile.findOne({
                where: {
                    id: open_ai_profile_id,
                    customer_uni_id: user_uni_id
                }
            });

            if (openAiProfile) {
                const open_ai_profile_data = {
                    customer_uni_id: user_uni_id,
                    name,
                    gender,
                    dob,
                    tob,
                    pob,
                    lat,
                    lon,
                    lang
                };

                if (typeof is_selected !== 'undefined') {
                    open_ai_profile_data.is_selected = is_selected;
                }

                await openAiProfile.update(open_ai_profile_data);
            }
        }
    }

    const result = await checkOpenAIProfile(user_uni_id);
    return result;
}

