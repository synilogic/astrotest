import express from "express";
import dotenv from 'dotenv';
import bcryptjs from "bcryptjs";
import Joi from "joi";
import db from "../_config/db.js";
import authenticateToken from  "../_middlewares/auth.js";
import UserOtp from "../_models/userOtps.js";
import { sendDltSms } from "../_helpers/otpSend.js";
import { formatDateTime } from "../_helpers/dateTimeFormat.js";
import { Op } from "sequelize";
import { generateUserApiKey,generateCustomerUniId,getUserData 
  ,generateAstrologerUniId,
  getAstrologerData,getAstroData,firebaseCustomAuthToken} from "../_helpers/common.js";
import User from "../_models/users.js";
import Customer from "../_models/customers.js";
import { ROLE_IDS,configData ,settingSliderFields} from '../_config/constants.js';
import Astrologer from "../_models/astrologers.js";
import multer from "multer";
dotenv.config();
const upload = multer();
const router = express.Router();


router.post("/astrologerLogin", upload.any(), async (req, res) => {
  const schema = Joi.object({
    phone: Joi.string().pattern(/^\+\d{10,15}$/).required(),
  otp: Joi.string().required(),
  country_code: Joi.string().allow('').optional(),
  country_name: Joi.string().allow('').optional(),
  otpless_orderId: Joi.string().allow('').optional(),
  user_ios_token: Joi.string().allow('').optional(),
  user_fcm_token: Joi.string().allow('').optional(),
  is_updated: Joi.number().optional(),
  referral_code: Joi.string().allow('').optional()
  });
 
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: 0, msg: error.details[0].message });
  }

  const {
    phone,
    otp,
    country_code,
    country_name,
    otpless_orderId,
    user_ios_token,
    user_fcm_token,
    is_updated,
    referral_code
  } = req.body;

  const DEFAULT_COUNTRY_CODE = '+91';
  const DEFAULT_COUNTRY_NAME = 'India';
  const DEFAULT_OTP_CODE = process.env.DEFAULT_OTP_CODE || '1234';
  const SMS_GATEWAY = process.env.SMS_GATEWAY || 'Fast2sms';
  const TEST_MOBILE = process.env.CUSTOMER_TEST_MOBILE || null;

  const finalCountryCode = '+' + (country_code || DEFAULT_COUNTRY_CODE).replace('+', '');
  const finalCountryName = country_name || DEFAULT_COUNTRY_NAME;

  if (referral_code && !(await validateReferralCode(referral_code))) {
    return res.status(400).json({ status: 0, msg: "Invalid Referral Code" });
  }

  let login_success = false;
  let otpRes = null;

  try {
    const currentTime = new Date();

    if (['Fast2sms', 'MessageIndia', 'TextLocal', 'CustomSms'].includes(SMS_GATEWAY)) {
      otpRes = await UserOtp.findOne({ where: { phone } });

      if (
        (otpRes && otpRes.otp === otp && new Date(otpRes.expires_at) > currentTime) ||
        otp === configData.default_otp
      ) {
        login_success = true;
      } else {
        return res.status(400).json({ status: 0, msg: "Incorrect OTP Entered or Expired." });
      }

    } else if (SMS_GATEWAY === 'OtpLess') {
      if (TEST_MOBILE && phone === TEST_MOBILE) {
        otpRes = await UserOtp.findOne({ where: { phone } });
      } else {
        otpRes = await verifyOtpByOtpless(phone, otpless_orderId, otp);
      }

      if (
        (otpRes && otpRes.otp === otp && new Date(otpRes.expires_at) > currentTime) ||
        (otpRes && otpRes.status === 1 && otpRes.isOTPVerified)
      ) {
        login_success = true;
      } else {
        return res.status(400).json({ status: 0, msg: otpRes?.msg || "Incorrect OTP Entered." });
      }

    } else {
      return res.status(400).json({ status: 0, msg: "Please activate your SMS gateway." });
    }

    if (!login_success) {
      return res.status(400).json({ status: 0, msg: "Login failed due to OTP verification." });
    }
    
    let user = await User.findOne({
      where: {
        phone,
        role_id: ROLE_IDS.ASTROLOGER,
        trash: 0
      }
    });

    if (!user) {
        const astrologerUniId = await generateAstrologerUniId();
     

              user = await User.create({
                user_uni_id: astrologerUniId,
                phone,
                country_code: finalCountryCode,
                country_name: finalCountryName,
                user_ios_token,
                user_fcm_token,
                role_id: ROLE_IDS.ASTROLOGER,
                referral_code: referral_code || null,
                status: 0,
                trash: 0
              });

              const astrouse = { astrologer_uni_id: astrologerUniId ,user_id:user.id};
               await Astrologer.create(astrouse);
                    //  if(settingSliderFields.astro_registration_mail_to_admin) {
                    //   const template = {
                    //     subject: 'New Astrologer Registered',
                    //     content: `Astrologer ID: ${user.user_uni_id}<br>Mobile No: ${user.phone}`,
                    //     template_code: 'default'
                    //   };

                    //   try {
                    //     await MyCommand.sendMailToAdmin(template);
                    //   } catch (mailErr) {
                    //     console.warn('Failed to send astrologer registration mail to admin:', mailErr.message);
                    //   }
                    //  }
         }
               
         let astrologer = await Astrologer.findOne({
            where: {
              astrologer_uni_id:user.user_uni_id
            }
          });
            
            const processStatus = parseInt(astrologer?.process_status || 0);
            const userStatus = parseInt(user?.status || 0);

              if (!(processStatus < 4 || (userStatus === 1 && processStatus === 4))) {
                return res.status(200).json({
                  status: 0,
                  msg: "Your account is inactive. Please contact support."
                });
              }

         
           const saveData = {};
          if (parseInt(is_updated) === 1) {
            const firebaseAuthToken = await firebaseCustomAuthToken(user.user_uni_id);
           
            if (firebaseAuthToken) {
              saveData.firebase_auth_token = firebaseAuthToken;
            }
          }

             if (user_fcm_token) {
            await User.update({ user_fcm_token: "" }, {
              where: {
                user_fcm_token,
                user_uni_id: { [Op.ne]: user.user_uni_id }
              }
            });
            saveData.user_fcm_token = user_fcm_token;
            saveData.is_uninstalled = 0;
          }

           if (user_ios_token) {
            await User.update({ user_ios_token: "" }, {
              where: {
                user_ios_token,
                user_uni_id: { [Op.ne]: user.user_uni_id }
              }
            });
            saveData.user_ios_token = user_ios_token;
            saveData.is_uninstalled = 0;
          }

          if (Object.keys(saveData).length > 0) {
            await user.update(saveData);
          }
            
        const userApiKey = await generateUserApiKey(user.user_uni_id, ROLE_IDS.ASTROLOGER);

          const data = await getAstrologerData({
          phone: user.phone,
          user_uni_id: user.user_uni_id
          }, true,req);

        // Safely extract plain object
        let astrologerData = Array.isArray(data) && data.length > 0
          ? (typeof data[0].get === 'function' ? data[0].get({ plain: true }) : data[0])
          : {};
          
          const currency_code = "INR";
          const currency_symbol = "₹";

        return res.status(200).json({
          status: 1,
          currency_code,
          currency_symbol,
          data: {
            ...astrologerData,
            user_api_key: userApiKey.api_key,
            currency_code,
            currency_symbol
          },
          msg: "You are Logged in Successfully"
        });

  } catch (err) {
    console.error("Astrologer Login Error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error", error: err.message });
  }
});

export default router;