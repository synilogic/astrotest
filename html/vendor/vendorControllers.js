import express from "express";
import User from "../_models/users.js";
import Vendor from "../_models/vendor.js";
import { constants, ROLE_IDS } from "../_config/constants.js";
import { generateCustomerUniId, generateUserApiKey, getTotalBalanceById, getUserData, getVendorData } from "../_helpers/common.js";
import { findArrayOfColumn, new_sequence_code, strip_scripts_filter } from "../_helpers/helper.js";
import Joi from "joi";
import { Op, fn, col, literal} from "sequelize";
import Wallet from "../_models/wallet.js";
import Product from "../_models/product.js";
import Order from "../_models/order.js";
import UserOtp from "../_models/userOtps.js";
import ApiKeyModel from "../_models/apikeys.js";
import moment from "moment-timezone";

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

    const createdUser = await User.create({
      ...attributes,
      role_id: constants.vendor_role_id,
      user_uni_id,
    });

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
    phone: Joi.string()
    
    .required(),
    otp: Joi.string().required(),
    country_code: Joi.string().optional(),
    country_name: Joi.string().optional(),
    otpless_orderId: Joi.string().optional(),
    user_ios_token: Joi.string().optional(),
    user_fcm_token: Joi.string().optional(),
    is_updated: Joi.number().optional(),
    referral_code: Joi.string().optional()
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
    
    const userOtpRecord = await UserOtp.findOne({ where: { phone } });
    
     
    // If OTP exists, validate it
    // if (!userOtpRecord || userOtpRecord.otp !== userOtp || userOtpRecord.expires_at < new Date()) {
    //   return res.status(400).json({ status: 0, msg: "Incorrect OTP or OTP has expired." });
    // }
            
    // OTP is valid, now login or register user
    let user = await User.findOne({ where: { phone, role_id:ROLE_IDS.VENDOR, trash: 0 } });
    const currencyCode = "INR";
    const currencySymbol = "₹";
if (!user) {
  return res.status(404).json({ status: 0, msg: "Vendor does not exist." });
} 

if (user.dataValues.status === 0) {
  return res.status(401).json({ status: 0, msg: "Oops! Your account is not activated. Please contact admin" });
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
    const userApiKey = await generateUserApiKey(user.user_uni_id,ROLE_IDS.VENDOR);
    console.log("token here",userApiKey);

    const userdetail = await User.findOne({
  where: {
    phone,
    role_id: ROLE_IDS.VENDOR,  // or your `$role_id` equivalent
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
    // return res.status(200).json({
    //   status: 1,
    //   currency_code: currencyCode,
    //   currency_symbol: currencySymbol,
    //   data: {
    //     id: customerData.id,
    //     customer_uni_id: customerData.customer_uni_id,
    //     city: customerData.city || null,
    //     state: customerData.state || null,
    //     country: customerData.country || null,
    //     birth_date: customerData.birth_date || '',
    //     gender: customerData.gender || null,
    //     age: customerData.age || null,
    //     customer_img: customerData.customer_img || 'https://aiastrologer.jyotishamnumerology.com/assets/img/customer.png',
    //     longitude: customerData.longitude || null,
    //     birth_place: customerData.birth_place || null,
    //     birth_time: customerData.birth_time || '',
    //     latitude: customerData.latitude || null,
    //     process_status: customerData.process_status ?? 0,
    //     uid: userData.id || null,
    //     phone: userData.phone || null,
    //     name: userData.name || null,
    //     email: userData.email || null,
    //     user_fcm_token: userData.user_fcm_token || null,
    //     user_ios_token: userData.user_ios_token || null,
    //     firebase_auth_token: userData.firebase_auth_token || '',
    //     status: userData.status ?? 1,
    //     user_api_key: userApiKey || '',
    //     currency_code: 'INR',
    //     currency_symbol: '₹'
    //     },
    //   msg: "You are Logged in Successfully"
    // });

    // return res.status(200).json({
    //   status: 1,
    //   currency_code: currencyCode,
    //   currency_symbol: currencySymbol,
    //   data: userdetail,
    //   msg: "You are Logged in Successfully"
    // });

    return res.status(200).json({
      status: 1,
      apiKey: userApiKey,
      uni_id: user.user_uni_id,
      msg: "You are Logged in Successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 0, msg: "Internal server error", error: error.message });
  }
});

router.get("/vendor-dashboard", async (req, res) => {
  try {
    // const data = req.session.userdetail;
    const data = req.body;
    // console.log(req.body);
    
    const vendorUniId = data.user_uni_id;
    const limit = parseInt(process.env.PAGINATION_PAGE_LIMIT) || 10;

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
    });

    const orders = await Order.findAndCountAll({
      where: { vendor_uni_id: vendorUniId },
      order: [['id', 'DESC']],
      limit,
      offset: ((parseInt(req.query.page) || 1) - 1) * limit,
    });

    // Graph: monthly vendor income over last 12 months
    const startMonth = moment().subtract(11, 'months').startOf('month');
    const endMonth = moment().endOf('month');

    const graphData = await Wallet.findAll({
      attributes: [
        [fn('SUM', col('amount')), 'amount'],
        // [literal("CONCAT(YEAR(wallets.created_at), '-', LPAD(MONTH(wallets.created_at), 2, '0'))"), 'months']
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: [],
        where: { role_id: ROLE_IDS.VENDOR },
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
    });
    const months = [];
    const vendorIncome = [];
    let cursor = startMonth.clone();
    while (cursor <= endMonth) {
      const formattedMonth = cursor.format('YYYY-MM');
      months.push(cursor.format('MMM YYYY'));

      const matchIndex = findArrayOfColumn(graphData, 'months', formattedMonth);
      vendorIncome.push(matchIndex !== -1 ? graphData[matchIndex].amount : 0);

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
      data,
      orders: orders.rows,
      total_income: income,
      total_balance: totalBalance,
      total_product: totalProduct,
      total_order: totalOrder,
      ...orderCounts,
      months,
      vendorpeincome: vendorIncome,
      i: ((parseInt(req.query.page) || 1) - 1) * limit,
    })

  } catch (error) {
    console.error('Error in vendorDashboard:', error);
    res.status(500).send('Internal Server Error');
  }
})

export default router;
