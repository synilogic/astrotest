import express from "express";
import User from "../_models/users.js";
import Vendor from "../_models/vendor.js";
import { constants, ROLE_IDS } from "../_config/constants.js";
import { generateCustomerUniId, generateUserApiKey, getTotalBalanceById, getUserData, getVendorData } from "../_helpers/common.js";
import { findArrayOfColumn, new_sequence_code, strip_scripts_filter } from "../_helpers/helper.js";
import Joi from "joi";
import { Op, fn, col, literal, QueryTypes } from "sequelize";
import sequelize from "../_config/db.js";
import Wallet from "../_models/wallet.js";
import Product from "../_models/product.js";
import Order from "../_models/order.js";
import UserOtp from "../_models/userOtps.js";
import ApiKeyModel from "../_models/apikeys.js";
import moment from "moment-timezone";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { checkUserApiKey } from "../_helpers/common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer();

const router = express.Router();

router.post("/vendor_registration", async (req, res) => {
  try {
    // 1. Validate user data
    const userSchema = Joi.object({
      role_id: Joi.any().optional(),
      name: Joi.string().max(50).required(),
      email: Joi.string().email().max(50).required(),
      phone: Joi.string().pattern(/^\d+$/).required(),
    });

    const vendorSchema = Joi.object({
      firm_name: Joi.string().max(200).required(),
      pin_code: Joi.string().length(constants.pin_code_length).required(),
      gst_no: Joi.string().length(constants.gst_number_length).required(),
      term: Joi.string().optional().allow("", null),
      address: Joi.string().required(),
      city: Joi.string().optional().allow("", null),
      state: Joi.string().optional().allow("", null),
      country: Joi.string().optional().allow("", null),
      latitude: Joi.string().optional().allow("", null),
      longitude: Joi.string().optional().allow("", null),
      vendor_image: Joi.string().optional().allow("", null),
      birth_date: Joi.string().optional().allow("", null),
    });

    const attributes = await userSchema.validateAsync(req.body, { allowUnknown: true });
    const vendor_info = await vendorSchema.validateAsync(req.body, { allowUnknown: true });

    // 2. Check unique constraints manually
    const existingUser = await User.findOne({
      where: {
        email: attributes.email,
      },
    });

    const existingPhone = await User.findOne({
      where: {
        phone: attributes.phone,
        role_id: constants.vendor_role_id,
      },
    });

    if (existingUser)
      return res.status(400).json({ error: "Email already exists" });
    if (existingPhone)
      return res
        .status(400)
        .json({ error: "Phone already exists for vendor role" });

    // 3. Create user & vendor
    const user_uni_id = await new_sequence_code("VEND");

    // Create user with status = 1 (activated)
    const createdUser = await User.create({
      ...attributes,
      role_id: constants.vendor_role_id,
      user_uni_id,
      status: 1, // Activate vendor account immediately upon registration
    });

    // If isVerified column exists, set it to 1
    try {
      const [columns] = await sequelize.query(
        `SHOW COLUMNS FROM users LIKE 'isVerified'`,
        { type: QueryTypes.SELECT }
      );
      
      if (columns && columns.length > 0) {
        await sequelize.query(
          `UPDATE users SET isVerified = 1 WHERE user_uni_id = :userUniId`,
          {
            replacements: { userUniId },
            type: QueryTypes.UPDATE
          }
        );
        console.log('[Vendor Registration] Set isVerified = 1 for vendor:', user_uni_id);
      }
    } catch (error) {
      // isVerified column doesn't exist, that's okay
      console.log('[Vendor Registration] isVerified column not found, skipping');
    }

    const createdVendor = await Vendor.create({
      ...vendor_info,
      vendor_uni_id: user_uni_id,
      term: strip_scripts_filter(vendor_info.term),
    });

    // 4. Generate API key
    await generateUserApiKey(user_uni_id);

    // 5. Send welcome mail if needed
    // if (!createdUser.welcome_mail && createdUser.email) {
    //   const sent = await MyCommand.SendNotification(user_uni_id, 'welcome-template-for-vendor', 'welcome-template-for-vendor');

    //   if (sent) {
    //     await User.update({ welcome_mail: 1 }, { where: { user_uni_id } });
    //   }
    // }

    return res
      .status(200)
      .json({ success: true, message: "Vendor registration successfully." });
  } catch (err) {
    console.error("Vendor registration failed:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Something went wrong",
        error: err.message,
      });
  }
});

router.post("/vendor-login", async (req, res) => {
  // Validate request
  const schema = Joi.object({
    // phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    phone: Joi.string().required(),
    otp: Joi.string().required(),
    country_code: Joi.string().optional().allow('', null),
    country_name: Joi.string().optional().allow('', null),
    otpless_orderId: Joi.string().optional().allow('', null),
    user_ios_token: Joi.string().optional().allow('', null),
    user_fcm_token: Joi.string().optional().allow('', null),
    is_updated: Joi.number().optional().allow(null),
    referral_code: Joi.string().optional().allow('', null)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: 0, msg: error.details[0].message });
  }

  const {
    phone,
    otp: userOtp,
    country_code,
    country_name,
    otpless_orderId,
    user_ios_token,
    user_fcm_token,
    is_updated,
    referral_code
  } = req.body;

  const defaultCountryCode = "+91"; // example, use your default country code
  const defaultCountryName = "India"; // example, use your default country name

  // Determine country code and name
  const finalCountryCode = country_code || defaultCountryCode;
  const finalCountryName = country_name || defaultCountryName;

  // Check if the referral code is valid
  if (referral_code && !validateReferralCode(referral_code)) {
    return res.status(400).json({ status: 0, msg: "Invalid Referral Code" });
  }

  // Check OTP and proceed
  try {
    console.log('[Vendor Login] ===== OTP Verification =====')
    console.log('[Vendor Login] Phone received:', phone)
    console.log('[Vendor Login] Phone type:', typeof phone)
    console.log('[Vendor Login] OTP received:', userOtp || 'MISSING')
    console.log('[Vendor Login] OTP type:', typeof userOtp)
    console.log('[Vendor Login] OTP length:', userOtp ? String(userOtp).length : 0)
    
    // Try to find OTP record with exact phone first
    let userOtpRecord = await UserOtp.findOne({ where: { phone } });
    
    // If not found, try with normalized phone (last 10 digits)
    if (!userOtpRecord && phone.startsWith('+')) {
      const digitsOnly = phone.replace(/\D/g, '');
      const normalizedPhone = digitsOnly.slice(-10);
      console.log('[Vendor Login] OTP not found with full phone, trying normalized:', normalizedPhone);
      userOtpRecord = await UserOtp.findOne({ where: { phone: normalizedPhone } });
    }
    
    // If still not found, try with phone without + or spaces
    if (!userOtpRecord) {
      const cleanPhone = phone.replace(/[+\s]/g, '');
      console.log('[Vendor Login] OTP not found, trying clean phone:', cleanPhone);
      userOtpRecord = await UserOtp.findOne({ where: { phone: cleanPhone } });
    }
    
    console.log('[Vendor Login] OTP record found:', !!userOtpRecord)
    if (userOtpRecord) {
      console.log('[Vendor Login] OTP record details:', {
        id: userOtpRecord.id,
        phone: userOtpRecord.phone,
        phoneInDB: userOtpRecord.phone,
        phoneReceived: phone,
        otpInDB: userOtpRecord.otp || 'MISSING',
        otpReceived: userOtp || 'MISSING',
        otpInDBType: typeof userOtpRecord.otp,
        otpReceivedType: typeof userOtp,
        otpInDBLength: userOtpRecord.otp ? String(userOtpRecord.otp).length : 0,
        otpReceivedLength: userOtp ? String(userOtp).length : 0,
        expires_at: userOtpRecord.expires_at,
        isExpired: userOtpRecord.expires_at < new Date(),
        now: new Date()
      })
    }
    
    // Validate OTP
    if (!userOtpRecord) {
      console.error('[Vendor Login] ❌ OTP record not found for phone:', phone)
      // Try to find any OTP records to help debug
      const allOtps = await UserOtp.findAll({ 
        where: { phone: { [Op.like]: `%${phone.slice(-10)}%` } },
        limit: 5,
        order: [['created_at', 'DESC']]
      });
      console.error('[Vendor Login] Sample OTP records found:', allOtps.map(o => ({ phone: o.phone, otp: o.otp, expires_at: o.expires_at })));
      return res.status(400).json({ status: 0, msg: "OTP not found. Please request a new OTP." });
    }
    
    // Convert both OTPs to strings for comparison
    const dbOtp = String(userOtpRecord.otp || '').trim();
    const receivedOtp = String(userOtp || '').trim();
    
    console.log('[Vendor Login] OTP Comparison:', {
      dbOtp: dbOtp,
      receivedOtp: receivedOtp,
      dbOtpLength: dbOtp.length,
      receivedOtpLength: receivedOtp.length,
      areEqual: dbOtp === receivedOtp,
      dbOtpCharCodes: dbOtp.split('').map(c => c.charCodeAt(0)),
      receivedOtpCharCodes: receivedOtp.split('').map(c => c.charCodeAt(0))
    });
    
    if (dbOtp !== receivedOtp) {
      console.error('[Vendor Login] ❌ OTP mismatch:', {
        expected: dbOtp,
        received: receivedOtp,
        expectedLength: dbOtp.length,
        receivedLength: receivedOtp.length,
        phoneInDB: userOtpRecord.phone,
        phoneReceived: phone
      })
      return res.status(400).json({ status: 0, msg: "Incorrect OTP. Please try again." });
    }
    
    if (userOtpRecord.expires_at < new Date()) {
      console.error('[Vendor Login] ❌ OTP expired:', {
        expires_at: userOtpRecord.expires_at,
        now: new Date()
      })
      return res.status(400).json({ status: 0, msg: "OTP has expired. Please request a new OTP." });
    }
    
    console.log('[Vendor Login] ✅ OTP validated successfully')
    
    // Normalize phone number - extract just the digits (remove country code if present)
    // Vendor registration stores phone as digits only (e.g., "9876543210")
    // But login might receive phone with country code (e.g., "+919876543210")
    console.log('[Vendor Login] ===== Vendor Search =====')
    console.log('[Vendor Login] Original phone received:', phone)
    console.log('[Vendor Login] Phone type:', typeof phone)
    
    let searchPhone = phone;
    const searchAttempts = [];
    
    // If phone starts with +, extract the number part (last 10 digits for India)
    if (phone.startsWith('+')) {
      // Extract last 10 digits (assuming Indian numbers)
      const digitsOnly = phone.replace(/\D/g, ''); // Remove all non-digits
      searchPhone = digitsOnly.slice(-10); // Take last 10 digits
      console.log('[Vendor Login] Normalized phone (last 10 digits):', { 
        original: phone, 
        allDigits: digitsOnly,
        normalized: searchPhone,
        normalizedLength: searchPhone.length
      });
      searchAttempts.push({ format: 'normalized (last 10)', phone: searchPhone });
    } else {
      // If no +, use as is but ensure it's only digits
      searchPhone = phone.replace(/\D/g, '');
      console.log('[Vendor Login] Cleaned phone (digits only):', searchPhone);
      searchAttempts.push({ format: 'cleaned (digits only)', phone: searchPhone });
    }
    
    // Try to find user with normalized phone
    console.log('[Vendor Login] Attempting search with normalized phone:', searchPhone);
    let user = await User.findOne({ 
      where: { 
        phone: searchPhone, 
        role_id: ROLE_IDS.VENDOR, 
        trash: 0 
      } 
    });
    
    if (user) {
      console.log('[Vendor Login] ✅ Vendor found with normalized phone:', {
        user_uni_id: user.user_uni_id,
        phone: user.phone,
        name: user.name
      });
    } else {
      console.log('[Vendor Login] ❌ Vendor not found with normalized phone:', searchPhone);
    }
    
    // If not found with normalized phone, try with original phone (in case it's stored with country code)
    if (!user) {
      console.log('[Vendor Login] Trying search with original phone:', phone);
      searchAttempts.push({ format: 'original', phone: phone });
      user = await User.findOne({ 
        where: { 
          phone: phone, 
          role_id: ROLE_IDS.VENDOR, 
          trash: 0 
        } 
      });
      
      if (user) {
        console.log('[Vendor Login] ✅ Vendor found with original phone');
      }
    }
    
    // If still not found, try with phone without any + or spaces
    if (!user) {
      const cleanPhone = phone.replace(/[+\s]/g, '');
      console.log('[Vendor Login] Trying search with clean phone (no + or spaces):', cleanPhone);
      searchAttempts.push({ format: 'clean (no + or spaces)', phone: cleanPhone });
      user = await User.findOne({ 
        where: { 
          phone: cleanPhone, 
          role_id: ROLE_IDS.VENDOR, 
          trash: 0 
        } 
      });
      
      if (user) {
        console.log('[Vendor Login] ✅ Vendor found with clean phone');
      }
    }
    
    // If still not found, try with phone starting from index 3 (skip +91)
    if (!user && phone.startsWith('+91') && phone.length > 3) {
      const phoneWithoutCountry = phone.substring(3); // Remove +91
      console.log('[Vendor Login] Trying search with phone without +91:', phoneWithoutCountry);
      searchAttempts.push({ format: 'without +91', phone: phoneWithoutCountry });
      user = await User.findOne({ 
        where: { 
          phone: phoneWithoutCountry, 
          role_id: ROLE_IDS.VENDOR, 
          trash: 0 
        } 
      });
      
      if (user) {
        console.log('[Vendor Login] ✅ Vendor found with phone without +91');
      }
    }
    
    const currencyCode = "INR";
    const currencySymbol = "₹";
    
if (!user) {
      // Try to find any vendors to help debug
      const allVendors = await User.findAll({ 
        where: { 
          role_id: ROLE_IDS.VENDOR, 
          trash: 0 
        },
        attributes: ['user_uni_id', 'phone', 'name', 'status', 'email'],
        limit: 10,
        order: [['created_at', 'DESC']]
      });
      
      console.error('[Vendor Login] ❌ Vendor not found in database after all attempts:', {
        originalPhone: phone,
        searchAttempts: searchAttempts,
        role_id: ROLE_IDS.VENDOR,
        totalVendorsInDB: allVendors.length,
        sampleVendors: allVendors.map(v => ({ 
          user_uni_id: v.user_uni_id,
          phone: v.phone, 
          phoneLength: v.phone ? String(v.phone).length : 0,
          phoneType: typeof v.phone,
          name: v.name,
          status: v.status
        }))
      });
      
      return res.status(404).json({ 
        status: 0, 
        msg: `Vendor does not exist with phone number ${phone}. Searched with: ${searchAttempts.map(a => a.phone).join(', ')}. Please check if the vendor is registered or contact admin.` 
      });
    }
    
    console.log('[Vendor Login] ✅ Vendor found:', {
      user_uni_id: user.user_uni_id,
      phone: user.phone,
      status: user.status
    }); 

// Check account status - use dataValues if available, otherwise direct property
const userStatus = user.dataValues?.status ?? user.status ?? 0;
console.log('[Vendor Login] User status check:', {
  user_uni_id: user.user_uni_id,
  status: userStatus,
  statusType: typeof userStatus,
  dataValues: user.dataValues?.status,
  directStatus: user.status
});

// Check isVerified if column exists
let isVerified = null;
try {
  const [result] = await sequelize.query(
    `SELECT isVerified FROM users WHERE user_uni_id = :userUniId`,
    {
      replacements: { userUniId: user.user_uni_id },
      type: QueryTypes.SELECT
    }
  );
  if (result && 'isVerified' in result) {
    isVerified = result.isVerified;
    console.log('[Vendor Login] isVerified check:', {
      user_uni_id: user.user_uni_id,
      isVerified: isVerified
    });
  }
} catch (error) {
  // isVerified column doesn't exist, that's okay
  console.log('[Vendor Login] isVerified column not found, skipping verification check');
}

if (userStatus === 0) {
  console.error('[Vendor Login] ❌ Account not activated:', {
    user_uni_id: user.user_uni_id,
    phone: user.phone,
    status: userStatus,
    isVerified: isVerified
  });
  return res.status(401).json({ 
    status: 0, 
    msg: "Oops! Your account is not activated. Please contact admin to activate your vendor account.",
    user_uni_id: user.user_uni_id,
    phone: user.phone
  });
}

// If isVerified column exists and is 0, also block login
if (isVerified !== null && isVerified === 0) {
  console.error('[Vendor Login] ❌ Account not verified:', {
    user_uni_id: user.user_uni_id,
    phone: user.phone,
    status: userStatus,
    isVerified: isVerified
  });
  return res.status(401).json({ 
    status: 0, 
    msg: "Oops! Your account is not verified. Please contact admin to verify your vendor account.",
    user_uni_id: user.user_uni_id,
    phone: user.phone
  });
}

    const updatedData = {};

    if (user_ios_token) {
      updatedData.user_ios_token = user_ios_token;
    }

    if (user_fcm_token) {
      updatedData.user_fcm_token = user_fcm_token;
    }

    if (Object.keys(updatedData).length > 0) {
      await user.update(updatedData);
    }
    // const data   = await getVendorData({
    //   phone: user.phone,
    //   user_uni_id: user.user_uni_id,
    // },false);
    // console.log({
    //   phone: user.phone,
    //   user_uni_id: user.user_uni_id,
    // });
    
    // // console.log("data here",data);
    // const customerData = data.get({ plain: true });
    // const userData = customerData.user || {};
    // Send the response with user data and API key
    const user_role_id=ROLE_IDS.USER;
    console.log( "userroleid",user_role_id);
    const userApiKeyObj = await generateUserApiKey(user.user_uni_id,ROLE_IDS.VENDOR);
    console.log('[Vendor Login] generateUserApiKey returned:', userApiKeyObj);
    console.log('[Vendor Login] userApiKeyObj type:', typeof userApiKeyObj);
    console.log('[Vendor Login] userApiKeyObj.api_key:', userApiKeyObj?.api_key);
    
    // Extract api_key from object - generateUserApiKey returns { api_key: "..." }
    const userApiKey = (userApiKeyObj && typeof userApiKeyObj === 'object' && userApiKeyObj.api_key) 
      ? String(userApiKeyObj.api_key).trim() 
      : (typeof userApiKeyObj === 'string' ? String(userApiKeyObj).trim() : '');
    
    console.log('[Vendor Login] Extracted API key:', {
      userApiKey: userApiKey,
      length: userApiKey.length,
      preview: userApiKey ? `${userApiKey.substring(0, 10)}...${userApiKey.substring(userApiKey.length - 10)}` : 'MISSING'
    });

    // Use the phone number that successfully found the user (from searchAttempts)
    const foundPhone = user.phone || phone
    
    console.log('[Vendor Login] Fetching user details with phone:', foundPhone)

    const userdetail = await User.findOne({
  where: {
        phone: foundPhone, // Use the phone that matched during search
        role_id: ROLE_IDS.VENDOR,
    status: 1
  },
  include: [
    {
      model: ApiKeyModel,
      as: 'apikey',
      attributes: ['api_key'],
      required: false
    },
    {
      model: Vendor,
      as: 'vendor',
      attributes: [
        'firm_name', 'vendor_image', 'gst_no',
        'city', 'state', 'country',
        'longitude', 'latitude', 'address', 'pin_code'
      ],
      required: false
    }
  ]
});

    if (!userdetail) {
      return res.status(404).json({ status: 0, msg: "Vendor details not found." });
    }

    const vendorData = userdetail.vendor || {};
    const vendorImage = vendorData.vendor_image 
      ? `${req.protocol}://${req.get('host')}/uploads/vendor/${vendorData.vendor_image}`
      : null;

    // Format response data for frontend
    const responseData = {
      id: userdetail.id,
      user_uni_id: userdetail.user_uni_id,
      phone: userdetail.phone || phone,
      name: userdetail.name || '',
      email: userdetail.email || '',
      user_fcm_token: userdetail.user_fcm_token || null,
      user_ios_token: userdetail.user_ios_token || null,
      firebase_auth_token: userdetail.firebase_auth_token || '',
      status: userdetail.status ?? 1,
      user_api_key: userApiKey,
      api_key: userApiKey, // Also include as api_key for compatibility
      role_id: ROLE_IDS.VENDOR,
      currency_code: currencyCode,
      currency_symbol: currencySymbol,
      vendor: {
        firm_name: vendorData.firm_name || '',
        vendor_image: vendorImage,
        gst_no: vendorData.gst_no || '',
        city: vendorData.city || null,
        state: vendorData.state || null,
        country: vendorData.country || null,
        longitude: vendorData.longitude || null,
        latitude: vendorData.latitude || null,
        address: vendorData.address || null,
        pin_code: vendorData.pin_code || null
      }
    };

    console.log('[Vendor Login] ===== Final Response Data =====');
    console.log('[Vendor Login] Response API keys:', {
      user_api_key: {
        value: responseData.user_api_key,
        type: typeof responseData.user_api_key,
        length: responseData.user_api_key ? String(responseData.user_api_key).length : 0,
        preview: responseData.user_api_key ? `${String(responseData.user_api_key).substring(0, 10)}...${String(responseData.user_api_key).substring(String(responseData.user_api_key).length - 10)}` : 'MISSING'
      },
      api_key: {
        value: responseData.api_key,
        type: typeof responseData.api_key,
        length: responseData.api_key ? String(responseData.api_key).length : 0,
        preview: responseData.api_key ? `${String(responseData.api_key).substring(0, 10)}...${String(responseData.api_key).substring(String(responseData.api_key).length - 10)}` : 'MISSING'
      }
    });
    console.log('[Vendor Login] user_uni_id:', responseData.user_uni_id);

    const finalResponse = {
      status: 1,
      currency_code: currencyCode,
      currency_symbol: currencySymbol,
      data: responseData,
      msg: "You are Logged in Successfully"
    };
    
    console.log('[Vendor Login] ✅ Sending response to frontend');
    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 0, msg: "Internal server error", error: error.message });
  }
});

// Get all vendors (for debugging/admin purposes)
router.get("/list-vendors", async (req, res) => {
  try {
    const vendors = await User.findAll({
      where: {
        role_id: ROLE_IDS.VENDOR,
        trash: 0
      },
      include: [
        {
          model: Vendor,
          as: 'vendor',
          required: false
        }
      ],
      attributes: ['id', 'user_uni_id', 'name', 'email', 'phone', 'status', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    const formattedVendors = vendors.map(v => {
      const vendorData = v.vendor || {};
      return {
        user_uni_id: v.user_uni_id,
        name: v.name,
        email: v.email,
        phone: v.phone,
        phoneLength: v.phone ? String(v.phone).length : 0,
        status: v.status,
        created_at: v.created_at,
        vendor: {
          firm_name: vendorData.firm_name || null,
          gst_no: vendorData.gst_no || null,
          city: vendorData.city || null,
          state: vendorData.state || null,
          country: vendorData.country || null
        }
      };
    });

    return res.json({
      status: 1,
      count: formattedVendors.length,
      data: formattedVendors,
      msg: 'Vendor list retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({
      status: 0,
      msg: 'Internal server error',
      error: error.message
    });
  }
});

router.post("/vendor-update", upload.any(), async (req, res) => {
  try {
    console.log('[Vendor Update] ===== Request received =====');
    console.log('[Vendor Update] Request body:', {
      api_key: req.body.api_key ? `${req.body.api_key.substring(0, 15)}...${req.body.api_key.substring(req.body.api_key.length - 15)}` : 'MISSING',
      api_key_full: req.body.api_key, // Log full key for debugging
      api_key_length: req.body.api_key ? req.body.api_key.length : 0,
      user_uni_id: req.body.user_uni_id,
      hasFiles: !!req.files && req.files.length > 0
    });
    console.log('[Vendor Update] Request headers:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'EXISTS' : 'MISSING'
    });
    
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      name: Joi.string().max(50).required(),
      email: Joi.string().email().max(50).required(),
      phone: Joi.string().pattern(/^\d+$/).required(),
      firm_name: Joi.string().max(200).required(),
      pin_code: Joi.string().length(constants.pin_code_length).required(),
      gst_no: Joi.string().length(constants.gst_number_length).required(),
      address: Joi.string().required(),
      city: Joi.string().optional().allow(null, ""),
      state: Joi.string().optional().allow(null, ""),
      country: Joi.string().optional().allow(null, ""),
      latitude: Joi.string().optional().allow(null, ""),
      longitude: Joi.string().optional().allow(null, ""),
      vendor_image: Joi.string().optional().allow(null, ""),
      term: Joi.string().optional().allow(null, ""),
      birth_date: Joi.string().optional().allow(null, ""),
    });

    const { error, value: attributes } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 0,
        errors: error.details,
        message: "Validation error",
        msg: error.details.map((err) => err.message).join("\n"),
      });
    }

    const { api_key, user_uni_id } = attributes;

    console.log('[Vendor Update] Validating API key:', {
      api_key_received: api_key ? `${api_key.substring(0, 15)}...${api_key.substring(api_key.length - 15)}` : 'MISSING',
      api_key_full: api_key, // Log full key for debugging
      api_key_length: api_key ? api_key.length : 0,
      user_uni_id: user_uni_id
    });

    // Check API key
    const apiKeyValid = await checkUserApiKey(api_key, user_uni_id);
    console.log('[Vendor Update] API key validation result:', {
      isValid: apiKeyValid,
      api_key_checked: api_key ? `${api_key.substring(0, 15)}...${api_key.substring(api_key.length - 15)}` : 'MISSING',
      user_uni_id: user_uni_id
    });
    
    if (!apiKeyValid) {
      console.error('[Vendor Update] ❌ API key validation failed');
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }
    
    console.log('[Vendor Update] ✅ API key validated successfully');

    // Find user and vendor
    const user = await User.findOne({ 
      where: { 
        user_uni_id,
        role_id: constants.vendor_role_id,
        trash: 0
      } 
    });
    
    const vendor = await Vendor.findOne({ 
      where: { 
        vendor_uni_id: user_uni_id 
      } 
    });

    if (!user || !vendor) {
      return res.status(404).json({ 
        status: 0, 
        msg: "Vendor not found" 
      });
    }

    // Check email uniqueness (exclude current user)
    const emailUser = await User.findOne({
      where: {
        email: attributes.email,
        role_id: constants.vendor_role_id,
        trash: 0,
        user_uni_id: { [Op.ne]: user_uni_id },
      },
    });
    if (emailUser) {
      return res.status(400).json({ 
        status: 0, 
        msg: "Email already exists for another vendor" 
      });
    }

    // Check phone uniqueness (exclude current user)
    const phoneUser = await User.findOne({
      where: {
        phone: attributes.phone,
        role_id: constants.vendor_role_id,
        trash: 0,
        user_uni_id: { [Op.ne]: user_uni_id },
      },
    });
    if (phoneUser) {
      return res.status(400).json({ 
        status: 0, 
        msg: "Phone already exists for another vendor" 
      });
    }

    // Handle vendor image upload
    const imgPath = path.join(__dirname, "../public/uploads/vendor");
    if (!fs.existsSync(imgPath)) {
      fs.mkdirSync(imgPath, { recursive: true });
    }

    const uploadedFile = req.files?.find(file => file.fieldname === "vendor_image");
    if (uploadedFile) {
      // Delete old image if exists
      if (vendor.vendor_image) {
        const oldImagePath = path.join(imgPath, vendor.vendor_image);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (err) {
            console.warn("Error deleting old vendor image:", err.message);
          }
        }
      }

      // Save new image
      const extension = path.extname(uploadedFile.originalname) || ".jpg";
      const filename = `${uuidv4()}${extension}`;
      const targetPath = path.join(imgPath, filename);

      if (uploadedFile.buffer) {
        fs.writeFileSync(targetPath, uploadedFile.buffer);
        attributes.vendor_image = filename;
      } else if (uploadedFile.path) {
        fs.renameSync(uploadedFile.path, targetPath);
        attributes.vendor_image = filename;
      }
    } else if (!attributes.vendor_image) {
      // Keep existing image if no new image provided
      attributes.vendor_image = vendor.vendor_image || null;
    }

    // Update user
    await user.update({
      name: attributes.name,
      email: attributes.email,
      phone: attributes.phone,
    });

    // Update vendor
    const vendorData = {
      firm_name: attributes.firm_name,
      pin_code: attributes.pin_code,
      gst_no: attributes.gst_no,
      address: attributes.address,
      city: attributes.city || null,
      state: attributes.state || null,
      country: attributes.country || null,
      latitude: attributes.latitude || null,
      longitude: attributes.longitude || null,
      vendor_image: attributes.vendor_image || null,
      term: attributes.term ? strip_scripts_filter(attributes.term) : vendor.term || null,
      birth_date: attributes.birth_date || null,
    };

    await vendor.update(vendorData);

    // Fetch updated vendor data
    const updatedUser = await User.findOne({
      where: { user_uni_id },
      include: [
        {
          model: Vendor,
          as: 'vendor',
          required: false
        }
      ]
    });

    const updatedVendorData = updatedUser.vendor || {};
    const vendorImage = updatedVendorData.vendor_image
      ? `${req.protocol}://${req.get('host')}/uploads/vendor/${updatedVendorData.vendor_image}`
      : null;

    return res.status(200).json({
      status: 1,
      data: {
        id: updatedUser.id,
        user_uni_id: updatedUser.user_uni_id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        vendor: {
          firm_name: updatedVendorData.firm_name || '',
          vendor_image: vendorImage,
          gst_no: updatedVendorData.gst_no || '',
          city: updatedVendorData.city || null,
          state: updatedVendorData.state || null,
          country: updatedVendorData.country || null,
          longitude: updatedVendorData.longitude || null,
          latitude: updatedVendorData.latitude || null,
          address: updatedVendorData.address || null,
          pin_code: updatedVendorData.pin_code || null,
          term: updatedVendorData.term || null,
          birth_date: updatedVendorData.birth_date || null,
        }
      },
      msg: "Vendor profile updated successfully"
    });
  } catch (err) {
    console.error("Error in /vendor-update:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal Server Error",
      error: err.message
    });
  }
});

// Debug endpoint to check API keys for a user
router.post("/debug-api-key", async (req, res) => {
  try {
    const { user_uni_id } = req.body;
    if (!user_uni_id) {
      return res.status(400).json({ status: 0, msg: "user_uni_id required" });
    }
    
    const allKeys = await ApiKeyModel.findAll({
      where: { user_uni_id },
      order: [['expires_at', 'DESC']]
    });
    
    return res.json({
      status: 1,
      user_uni_id,
      total_keys: allKeys.length,
      keys: allKeys.map(k => ({
        id: k.id,
        api_key: k.api_key,
        api_key_length: k.api_key ? k.api_key.length : 0,
        expires_at: k.expires_at,
        expires_at_date: new Date(k.expires_at * 1000).toISOString(),
        isExpired: k.expires_at < Math.floor(Date.now() / 1000),
        timeRemaining: k.expires_at - Math.floor(Date.now() / 1000)
      }))
    });
  } catch (error) {
    console.error('[Debug API Key] Error:', error);
    return res.status(500).json({ status: 0, msg: error.message });
  }
});

router.post("/vendor-dashboard", async (req, res) => {
  try {
    console.log('[Vendor Dashboard] ===== Request Received =====')
    console.log('[Vendor Dashboard] Request method:', req.method)
    console.log('[Vendor Dashboard] Request headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    })
    console.log('[Vendor Dashboard] Raw request body:', req.body)
    console.log('[Vendor Dashboard] Request body type:', typeof req.body)
    console.log('[Vendor Dashboard] Request body keys:', Object.keys(req.body || {}))
    
    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('[Vendor Dashboard] ❌ Request body is empty!')
      return res.status(400).json({
        status: 0,
        msg: "Request body is empty. Make sure Content-Type is application/json"
      });
    }
    
    // Validate request
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      console.error('[Vendor Dashboard] Validation error:', error.details)
      return res.status(400).json({
        status: 0,
        errors: error.details,
        message: "Validation error",
        msg: error.details.map((err) => err.message).join("\n"),
      });
    }

    const { api_key, user_uni_id } = value;
    
    console.log('[Vendor Dashboard] Validated data:', {
      user_uni_id: user_uni_id,
      api_key_length: api_key ? api_key.length : 0,
      api_key_preview: api_key ? `${api_key.substring(0, 10)}...${api_key.substring(api_key.length - 10)}` : 'MISSING',
      api_key_full: api_key // Log full key for debugging
    })

    // Check API key
    const isValidKey = await checkUserApiKey(api_key, user_uni_id);
    console.log('[Vendor Dashboard] API key validation result:', isValidKey)
    
    if (!isValidKey) {
      console.error('[Vendor Dashboard] ❌ API key validation failed:', {
        user_uni_id: user_uni_id,
        api_key_length: api_key ? api_key.length : 0,
        api_key_preview: api_key ? `${api_key.substring(0, 10)}...${api_key.substring(api_key.length - 10)}` : 'MISSING',
        api_key_full: api_key // Log full key for debugging
      })
      
      // Debug: Check what API keys exist for this user
      const allKeysForUser = await ApiKeyModel.findAll({
        where: { user_uni_id: user_uni_id },
        limit: 5,
        order: [['expires_at', 'DESC']]
      });
      console.log('[Vendor Dashboard] All API keys in database for this user:', allKeysForUser.map(k => ({
        id: k.id,
        api_key_length: k.api_key ? k.api_key.length : 0,
        api_key_preview: k.api_key ? `${k.api_key.substring(0, 10)}...${k.api_key.substring(k.api_key.length - 10)}` : 'EMPTY',
        api_key_full: k.api_key, // Log full key for debugging
        expires_at: k.expires_at,
        isExpired: k.expires_at < Math.floor(Date.now() / 1000)
      })));
      
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: "Unauthorized User... Please login again",
      });
    }
    
    console.log('[Vendor Dashboard] ✅ API key validated successfully')

    const vendorUniId = user_uni_id;
    const limit = parseInt(process.env.PAGINATION_PAGE_LIMIT) || 10;

    // Get vendor user details
    const vendorUser = await User.findOne({
      where: {
        user_uni_id: vendorUniId,
        role_id: ROLE_IDS.VENDOR,
        trash: 0
      },
      include: [{
        model: Vendor,
        as: 'vendor',
        required: false
      }]
    });

    if (!vendorUser) {
      return res.status(404).json({
        status: 0,
        msg: "Vendor not found"
      });
    }

    const vendorData = vendorUser.vendor || {};
    const vendorImage = vendorData.vendor_image 
      ? `${req.protocol}://${req.get('host')}/uploads/vendor/${vendorData.vendor_image}`
      : null;

    const [totalProduct, totalOrder] = await Promise.all([
      Product.count({ where: { vendor_uni_id: vendorUniId } }),
      Order.count({ where: { vendor_uni_id: vendorUniId } }),
    ]);

    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');

    const statuses = ['pending', 'cancel', 'dispatch', 'confirm', 'delivered'];
    const orderCounts = {};

    for (let status of statuses) {
      orderCounts[`total_${status}_order`] = await Order.count({
        where: { vendor_uni_id: vendorUniId, status },
      });

      orderCounts[`total_${status}_yesterday_order`] = await Order.count({
        where: {
          vendor_uni_id: vendorUniId,
          status,
          created_at: {
            [Op.gte]: moment(yesterday).startOf('day').toDate(),
            [Op.lte]: moment(yesterday).endOf('day').toDate(),
          },
        },
      });

      orderCounts[`total_${status}_today_order`] = await Order.count({
        where: {
          vendor_uni_id: vendorUniId,
          status,
          created_at: {
            [Op.gte]: moment(today).startOf('day').toDate(),
            [Op.lte]: moment(today).endOf('day').toDate(),
          },
        },
      });
    }

    const totalBalance = await getTotalBalanceById(vendorUniId, 1);

    const income = await Wallet.sum('amount', {
      where: {
        user_uni_id: vendorUniId,
        status: 1,
        main_type: 'cr',
      },
    }) || 0; // Default to 0 if null/undefined

    const orders = await Order.findAndCountAll({
      where: { vendor_uni_id: vendorUniId },
      order: [['id', 'DESC']],
      limit,
      offset: ((parseInt(req.query.page) || 1) - 1) * limit,
    });

    // Graph: monthly vendor income over last 12 months
    const startMonth = moment().subtract(11, 'months').startOf('month');
    const endMonth = moment().endOf('month');

    // Safely fetch graph data with error handling
    let graphData = [];
    try {
      graphData = await Wallet.findAll({
      attributes: [
        [fn('SUM', col('amount')), 'amount'],
        // [literal("CONCAT(YEAR(wallets.created_at), '-', LPAD(MONTH(wallets.created_at), 2, '0'))"), 'months']
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: [],
        where: { role_id: ROLE_IDS.VENDOR },
          required: false
      }],
      where: {
        user_uni_id: vendorUniId,
        main_type: 'cr',
        created_at: {
          [Op.between]: [startMonth.toDate(), endMonth.toDate()],
        },
      },
      // group: ['months'],
      order: [['created_at', 'ASC']],
      raw: true,
      }) || [];
    } catch (graphErr) {
      console.error('[Vendor Dashboard] Error fetching graph data:', graphErr);
      graphData = [];
    }
    
    const months = [];
    const vendorIncome = [];
    let cursor = startMonth.clone();
    while (cursor <= endMonth) {
      const formattedMonth = cursor.format('YYYY-MM');
      months.push(cursor.format('MMM YYYY'));

      // Safely access graphData - handle null/undefined/empty array
      let incomeAmount = 0;
      if (graphData && Array.isArray(graphData) && graphData.length > 0) {
      const matchIndex = findArrayOfColumn(graphData, 'months', formattedMonth);
        if (matchIndex !== -1 && graphData[matchIndex]) {
          const matchedData = graphData[matchIndex];
          incomeAmount = matchedData.amount ? (parseFloat(matchedData.amount) || 0) : 0;
        }
      }
      vendorIncome.push(incomeAmount);

      cursor.add(1, 'month');
    }

    // return res.render(`front_theme/${process.env.THEME}/home/vendor/vendordashboard`, {
    //   data,
    //   orders: orders.rows,
    //   total_income: income,
    //   total_balance: totalBalance,
    //   total_product: totalProduct,
    //   total_order: totalOrder,
    //   ...orderCounts,
    //   months,
    //   vendorpeincome: vendorIncome,
    //   i: ((parseInt(req.query.page) || 1) - 1) * limit,
    // });

    return res.status(200).json({
      status: 1,
      data: {
        data: {
          user_uni_id: vendorUser.user_uni_id,
          name: vendorUser.name || '',
          email: vendorUser.email || '',
          phone: vendorUser.phone || '',
          vendor_image: vendorImage,
          vendor: {
            firm_name: vendorData.firm_name || '',
            vendor_image: vendorImage,
            gst_no: vendorData.gst_no || '',
            city: vendorData.city || null,
            state: vendorData.state || null,
            country: vendorData.country || null,
            longitude: vendorData.longitude || null,
            latitude: vendorData.latitude || null,
            address: vendorData.address || null,
            pin_code: vendorData.pin_code || null
          }
        },
      orders: orders.rows || [],
        total_income: income || 0,
        total_balance: totalBalance || 0,
        total_product: totalProduct || 0,
        total_order: totalOrder || 0,
      ...orderCounts,
      months: months || [],
      vendorpeincome: vendorIncome || [],
      i: ((parseInt(req.query.page) || 1) - 1) * limit,
      },
      msg: "Vendor dashboard data fetched successfully"
    })

  } catch (error) {
    console.error('Error in vendorDashboard:', error);
    return res.status(500).json({
      status: 0,
      msg: "Internal Server Error",
      error: error.message
    });
  }
})

export default router;
