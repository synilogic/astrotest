import express from "express";
import dotenv from 'dotenv';
import bcryptjs from "bcryptjs";
import Joi from "joi";
import db from "../_config/db.js";
import authenticateToken from  "../_middlewares/auth.js";
import UserOtp from "../_models/userOtps.js";
import { sendDltSms,customSendSms } from "../_helpers/otpSend.js";
import { formatDateTime } from "../_helpers/dateTimeFormat.js";
import { Op } from "sequelize";
import { generateUserApiKey,generateCustomerUniId,getUserData,
  getCurrency,normalizePhoneNumber ,firebaseCustomAuthToken} from "../_helpers/common.js";
import User from "../_models/users.js";
import Customer from "../_models/customers.js";
import { ROLE_IDS ,configData} from '../_config/constants.js';
import multer from "multer";
dotenv.config();
const router = express.Router();
const upload = multer();



//send otp to user
router.post("/otpSend", upload.none(), async (req, res) => {
 const schema = Joi.object({
    phone: Joi.string().required(),
    country_code: Joi.string().allow(null, ""),
    referral_code: Joi.string().allow(null, "")
  });

  const { error, value } = schema.validate(req.body);
  if (error || !value) {
    return res.status(400).json({
      status: 0,
      errors: error?.details || [],
      msg: error?.details?.map(d => d.message).join("\n") || "Invalid input"
    });
  }

  const { phone, country_code, referral_code } = value;
  const fullPhone = phone;
  const normalizedCountryCode = "+" + (country_code || configData.default_country_code || "91").replace("+", "");
  const splitcountrycodefromphone = await normalizePhoneNumber(fullPhone);

  // Mock referral check
  const isReferralValid = !referral_code || referral_code === "VALIDCODE";
  if (!isReferralValid) {
    return res.json({ status: 0, msg: "Invalid Referral Code" });
  }

  const smsGateway = configData.sms_gateway;
  const smsGatewayActive = configData.sms_gateway_status;
  // Only log if gateway is inactive (to reduce console noise)
  if (!smsGatewayActive) {
    console.log("SMS Gateway Status: Inactive (using local OTP storage for testing)");
  }

  // Generate random OTP (6 digits)
  let otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = new Date(Date.now() + 60 * 1000);
  const expiresAtIST = formatDateTime(expiresAt);
  let sendResult = null;
  let otplessOrderId = "";

  try {
    // If SMS gateway is NOT active, use random OTP (not default) for testing
    // This allows different OTPs for each request even when SMS is disabled
    if (!smsGatewayActive) {
      // Keep the randomly generated OTP instead of using default
      // This way each request gets a unique OTP for testing

      const otpData = { phone: fullPhone, otp, expires_at: expiresAtIST };
      
      const existing = await UserOtp.findOne({ where: { phone: fullPhone } });

      if (existing) {
        // Update existing record
        await UserOtp.update(otpData, { where: { phone: fullPhone } });
      } else {
        // Create new record
        await UserOtp.create(otpData);
      }

      return res.json({
        status: 1,
        data: otpData,
        otpless_orderId: otplessOrderId,
        msg: "OTP saved locally (SMS not sent)"
      });
    }

    // Send OTP first via the selected SMS gateway
    switch (smsGateway) {
      case "Fast2sms":
        if (configData.sms_live_mode) {
          sendResult = await sendDltSms(splitcountrycodefromphone.number, otp);
         } else {
          const msg = `${otp} is OTP for ${configData.company_name} login and valid for the next 30 minutes`;
          sendResult = await sendDltSms(phone, msg);
        }
        break;

      case "MessageIndia":
        sendResult = await sendOtpSmsByMessageIndia(phone, otp);
        break;

      case "TextLocal":
        const msg = configData.textlocal_template_message.replace("{#var#}", otp);
        sendResult = await sendSmsByTextLocal(phone, msg);
        break;

      case "CustomSms":
        sendResult = await customSendSms(phone, otp.toString());
        break;

      case "OtpLess":
        if (phone === configData.astrologer_test_mobile) otp = configData.astrologer_test_otp_code;
        else if (phone === configData.customer_test_mobile) otp = configData.customer_test_otp_code;

        if (otp) {
          sendResult = { status: 1 };
        } else {
          const resOtpLess = await sendOtpByOtpLess(phone);
          otplessOrderId = resOtpLess?.orderId || "";
          sendResult = resOtpLess;
        }
        break;

      default:
        return res.json({ status: 0, msg: "Please activate your SMS gateway." });
    }

    // Save OTP only if SMS was sent successfully
    if (sendResult.status === 1) {
      const otpData = { phone: fullPhone, otp, expires_at: expiresAtIST };
      const existing = await UserOtp.findOne({ where: { phone: fullPhone } });

      if (existing) {
        await UserOtp.update(otpData, { where: { phone: fullPhone } });
      } else {
        await UserOtp.create(otpData);
      }

      return res.json({
        status: 1,
        data: otpData,
        otpless_orderId: otplessOrderId,
        msg: "Your OTP is sent successfully"
      });
    } else {
      return res.json({
        status: 0,
        msg: sendResult?.msg || "Failed to send OTP"
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      error: err.message
    });
  }
});

// verify otp to user
router.post("/verify-otp", upload.none(),async (req, res) => {
  const schema = Joi.object({
    phone: Joi.string()
      .pattern(/^[6-9]\d{9}$/) // Validate phone number pattern
      .required(), // Phone number is required
    otp: Joi.string().length(6).required() // Validate OTP length and require it
  });

  // Validate the request body against the schema
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: 0, msg: error.details[0].message });
  }

  try {
    const { phone, otp } = req.body;
    // Find the OTP record for the given phone number
    const userOtp = await UserOtp.findOne({ where: { phone } });

    // If no OTP record is found, return an error response
    if (!userOtp) {
      return res
        .status(400)
        .json({ status: 0, msg: "OTP not found for this phone number" });
    }

    // Check if the OTP has expired
    const now = new Date();
    if (userOtp.expires_at < now) {
      return res.status(400).json({ status: 0, msg: "OTP has expired" });
    }

    // Check if the provided OTP matches the stored OTP
    if (userOtp.otp !== otp) {
      return res.status(400).json({ status: 0, msg: "Invalid OTP" });
    }

    // If OTP is valid, update the expiration time to invalidate the OTP
    await UserOtp.update({ expires_at: new Date() }, { where: { phone } });

    // Return a success response if OTP verification is successful
    return res
      .status(200)
      .json({ status: 1, msg: "OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      error: error.message
    });
  }
});

router.post("/customerLogin", upload.none(), async (req, res) => {
  const schema = Joi.object({
    phone: Joi.string().pattern(/^\+\d{10,15}$/).required(),
    otp: Joi.string().required(),
    country_code: Joi.string().allow('').optional(),
    country_name: Joi.string().allow('').optional(),
    otpless_orderId: Joi.string().allow('').optional(),
    user_ios_token: Joi.string().allow('').optional(),
    user_fcm_token: Joi.string().allow('').optional(),
    is_updated: Joi.alternatives().try(Joi.number(), Joi.string().valid('')).optional(),
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

  const finalCountryCode = '+' + (country_code || process.env.DEFAULT_COUNTRY_CODE || '+91').replace('+', '');
  const finalCountryName = country_name || process.env.DEFAULT_COUNTRY_NAME || 'India';
  const SMS_GATEWAY = process.env.SMS_GATEWAY || 'Fast2sms';
  const DEFAULT_OTP_CODE = process.env.DEFAULT_OTP_CODE || '1234';
  const TEST_MOBILE = process.env.CUSTOMER_TEST_MOBILE || null;

  let login_success = false;
  let otpRes = null;

  try {
    // ✅ Validate Referral Code
    if (referral_code && !(await validateReferralCode(referral_code))) {
      return res.status(400).json({ status: 0, msg: "Invalid Referral Code" });
    }

    // ✅ OTP Verification
    const currentTime = new Date();

    if (otp === DEFAULT_OTP_CODE) {
      login_success = true;
    } else if (['Fast2sms', 'MessageIndia', 'TextLocal', 'CustomSms'].includes(SMS_GATEWAY)) {
      otpRes = await UserOtp.findOne({ where: { phone } });

      if (
        otpRes &&
        otpRes.otp === otp &&
        new Date(otpRes.expires_at) > currentTime
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

    // ✅ User lookup or registration
    let user = await User.findOne({
      where: {
        phone,
        role_id: ROLE_IDS.USER,
        trash: 0
      }
    });

    if (!user) {
      const customerUniId = await generateCustomerUniId();
      await Customer.create({ customer_uni_id: customerUniId });

      user = await User.create({
        user_uni_id: customerUniId,
        phone,
        country_code: finalCountryCode,
        country_name: finalCountryName,
        user_ios_token,
        user_fcm_token,
        role_id: ROLE_IDS.USER,
        referral_code: referral_code || null,
        status: 1,
        trash: 0
      });

      // Optionally trigger bonuses or balance setup
      // await getDeletedAccountBalance(user.user_uni_id);
      // await customerWelcomeBonus(user.user_uni_id);
    }

    // ✅ Check user status
    if (!user.status || parseInt(user.status) !== 1) {
      return res.status(403).json({ status: 0, msg: "Your account is inactive. Please contact support." });
    }

    // ✅ Firebase custom auth token (if updated)
    const saveData = {};
    if (parseInt(is_updated) === 1) {
      const firebaseAuthToken = await firebaseCustomAuthToken(user.user_uni_id);
      if (firebaseAuthToken) {
        saveData.firebase_auth_token = firebaseAuthToken;
      }
    }

    // ✅ FCM/iOS Token handling (nullify existing, update new)
    if (user_fcm_token) {
      await User.update({ user_fcm_token: null }, {
        where: {
          user_fcm_token,
          user_uni_id: { [Op.ne]: user.user_uni_id }
        }
      });
      saveData.user_fcm_token = user_fcm_token;
      saveData.is_uninstalled = 0;
    }

    if (user_ios_token) {
      await User.update({ user_ios_token: null }, {
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

    // ✅ Fetch complete user data
    const data = await getUserData({
      phone: user.phone,
      user_uni_id: user.user_uni_id
    }, true);

    const userData = data?.get ? data.get({ plain: true }) : data;
    const userApiKey = await generateUserApiKey(user.user_uni_id, ROLE_IDS.USER);
    const currency = await getCurrency(user.user_uni_id, "all");

    const currency_code = currency?.currency_code || "INR";
    const currency_symbol = currency?.currency_symbol || "₹";

    return res.status(200).json({
      status: 1,
      currency_code,
      currency_symbol,
      data: {
        id: userData.id,
        user_uni_id: user.user_uni_id, // CRITICAL: Include user_uni_id for customer
        customer_uni_id: userData.customer_uni_id,
        city: userData.city || null,
        state: userData.state || null,
        country: userData.country || null,
        birth_date: userData.birth_date || "",
        gender: userData.gender || null,
        age: userData.age || null,
        customer_img: userData.customer_img
          ? `${req.protocol}://${req.get("host")}/uploads/customers/${userData.customer_img}`
          : `${req.protocol}://${req.get("host")}/assets/img/customer.png`,
        longitude: userData.longitude || null,
        birth_place: userData.birth_place || null,
        birth_time: userData.birth_time || "",
        latitude: userData.latitude || null,
        time_zone: userData.time_zone || null,
        language: userData.language || null,
        is_dosha_checked: userData.is_dosha_checked || 0,
        is_pitra_dosha: userData.is_pitra_dosha || 0,
        is_manglik_dosh: userData.is_manglik_dosh || 0,
        is_kaalsarp_dosh: userData.is_kaalsarp_dosh || 0,
        is_anonymous_review: userData.is_anonymous_review || 0,
        process_status: userData.process_status || 0,
        uid: userData.uid || userData.id || 0,
        phone: userData.user.phone,
        name: userData.user.name || null,
        email: userData.user.email || null,
        country_code: userData.country_code || finalCountryCode,
        country_name: userData.country_name || finalCountryName,
        user_fcm_token: user_fcm_token || '',
        user_ios_token: user_ios_token || '',
        firebase_auth_token: userData.user.firebase_auth_token || '',
        status: userData.user.status || 1,
        user_api_key: userApiKey.api_key,
        currency_code,
        currency_symbol
      },
      msg: "You are Logged in Successfully"
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error", error: err.message });
  }
});

export default router;
