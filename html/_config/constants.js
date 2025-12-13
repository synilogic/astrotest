// src/config/constants.js
import dotenv from 'dotenv';
dotenv.config();

export const ROLE_IDS = {
  SUPERADMIN: 1,
  ADMIN: 2,
  USER: 4,
  ASTROLOGER: 3,
  VENDOR: 5,
};

export const USER_ROLES = {
  1: "superadmin",
  2: "admin",
  4: "user",
  3: "astrologer",
  5: "vendor",
};

export const settingSliderFields = [
  'astro_registration_mail_to_admin'
];



export const STATUS_CODES = {
  ACTIVE: "1",
  INACTIVE: "0",
};

export const JWT_EXPIRATION = 86400; // 24 hours
////////////////////////////vihsal///////////////
export const api_page_limit_secondary = 15;
export const API_PAGE_LIMIT = 10; 
export const DEFAULT_SWITCHWORD_IMAGE_PATH = 'assets/img/switchword.png';
export const SANJEEVINI_IMAGE_PATH = 'uploads/sanjeevini/';
export const DEFAULT_SANJEEVINI_IMAGE_PATH = 'default/default_sanjeevini.png';
export const DEFAULT_IMAGE_PATH = '/default/default-image.jpg';

export const PDF_BOOK_CATEGORY_IMAGE_PATH = '/uploads/pdf_book_category/';

export const GST_PERCENT = 18;
export const REFERENCE_PERCENT = 10;
export const REFERENCE_DISCOUNT_PERCENT = 5;
export const TDS_PERCENT = 5;
export const ENABLE_TDS = 1;


export const CUSTOMER_IMAGE_PATH = '/uploads/customer/';
export const ASTROLOGER_IMAGE_PATH = '/uploads/astrologer/';
export const DEFAULT_CUSTOMER_IMAGE = '/default/user.png';
export const DEFAULT_ASTROLOGER_IMAGE = '/default/astro.png';

export const IMAGE_BASE_URL_CUSTOMER = 'https://yourdomain.com/uploads/customer/';
export const IMAGE_BASE_URL_ASTROLOGER = 'https://yourdomain.com/uploads/astrologer/';


export const ai_astrologer_category = {
  western_astrology: 'Western Astrology',
  tarot_card_reading: 'Tarot Card Reading',
  prashna: 'Prashna',
  Numerology: 'numerology',
  kp_astrology: 'KP Astrology',
  lal_kitab: 'Lal Kitab',
  vedic_astrology: 'Vedic Astrology'
};


export const constants = {
  // API_PAGE_LIMIT_SECONDARY : 15,
  api_page_limit_secondary:15,
  base_url: process.env.BASE_URL || "http://localhost:8006",
  low_price_offer_on_voice_call: 1,
  low_price_offer_on_chat: 1,
  first_call_free_minutes:"",
  next_online_time:"",
  low_price_offer_on_video_call: 0,
  free_minutes_offer_on_voice_call: 1,
  free_minutes_offer_on_chat: 0,
  free_minutes_offer_on_video_call: 1,
  default_bot_message:"Hello! I'm here to help you.",
   open_ai_chat_api_page_limit:6,
  country_calling_code: "+91",
  in_app_voice_call: 1,
  astrologer_image_path: "uploads/astrologer/",
  default_astrologer_image_path: "assets/img/astrologer.jpg",
  country_calling_code: "+91",
  customer_image_path: "uploads/customer/",
  default_customer_image_path: "assets/img/customer.png",
  small_image_width: "300",
  small_image_height: "300",
  icon_image_width: "100",
  icon_image_height: "100",
  chat_api_page_limit: 20,
  pin_code_length: 6,
  gst_number_length: 15,
  paid_kundli_path:'uploads/paid_kundli/',
  vendor_role_id: 5,
  ARCHITECT_CATEGORY_ID: 10,
  ELECTRO_HOMOEOPATHY_CATEGORY_ID: 11,
  api_page_limit_notification: 8,
  api_page_limit: 6,
  api_page_limit_secondary: 15,
  default_country_code: "+91",
  ivr_count: "3",
  ivr_after_seconds: 60,
  request_waiting: 180,
  architect_category_id: "17",
  electro_homoeopathy_category_id: "18",
  setting_image_path: "uploads/setting/",
  banner_image_path: "uploads/banner/",
  
    
image_base_url: "http://145.223.23.142:8007/",
pdf_image_path: 'uploads/pdf/',
sample_pdf_path: 'uploads/sample_pdf/',
main_pdf_path: 'uploads/main_pdf/',
PDF_BOOK_CATEGORY_IMAGE_PATH: 'uploads/pdf_book_categories/',
default_pdf_image_path: 'default/default_pdf.png',
PDF_BOOK_IMAGE_PATH: 'uploads/pdf/',
default_paid_kundli_manual_image: 'uploads/default/manual.png',
paid_kundli_manual_image: 'uploads/paid_kundli_manual/',
paid_kundli_manual_image_path:'uploads/paid_kundli_manual/',
paid_kundli_manual_pdf_path: '/uploads/paid_kundli_manual/',
default_paid_kundli_manual_image_path:'assets/img/banner.jpg',
IMAGE_BASE_URL_NOTICE: '/uploads/notice_image',



  astro_update_request_list: [
    "Name",
    "Mobile Number",
    "Email ID",
    "Bank Details",
  ],
  default_banner_image_path: "assets/img/banner.jpg",
  service_available_time: "5",
  customer_dashboard_chat_limit: 6,
  'offline_service_category_image_path': 'uploads/offlne_service_category/',
  'service_category_image_path': 'uploads/service_category/',
  'default_image_path': 'assets/img/default.jpg',
  'product_category_image_path': 'uploads/product_category/',
  'default_product_image_path': 'assets/img/product.png',
  'group_puja_category_image_path': 'uploads/group_puja_category/',
  'blog_image_path': 'uploads/blog/',
  'service_image_path': 'uploads/service/',
   'call_history_file_path' : 'uploads/call_history_file/',
     'astrologer_gellery' : 'uploads/astrologer/gellery/',
  'astrologer_doc_image_path' : 'uploads/astrologer/doc/',

   MAX_ALLOWED_PREDEFINED_MSG: 10,
     'gift_image_path' : 'uploads/gift/',
};



export const imagePath = {
  CATEGORY_IMAGE_PATH: "uploads/category/",
  course_image_path: "uploads/course_image/",
  course_video_file_path: "uploads/course_video_file/",
  default_course_image_path: "assets/img/banner.jpg",
  customer_image_path: "uploads/customer/",
  default_customer_image_path: "assets/img/customer.png",
  astrologer_image_path: "uploads/astrologer/",
  default_astrologer_image_path: "assets/img/astrologer.jpg",
  default_sanjeevini_image : "assets/img/sanjeevini.png",
  chat_file_path:'uploads/chat/',
};


// export const APP_NAME = 'AstroNode';





export const configData = {
  sms_gateway: process.env.SMS_GATEWAY || 'Fast2sms', // or 'MessageIndia', etc.
  sms_live_mode: process.env.SMS_LIVE_MODE === 'true' || process.env.SMS_LIVE_MODE === '1' || true,
  default_country_code: process.env.DEFAULT_COUNTRY_CODE || '91',
  company_name: process.env.COMPANY_NAME || 'YourCompany',
  architect_category_id: process.env.ARCHITECT_CATEGORY_ID || '17',
  electro_homoeopathy_category_id: process.env.ELECTRO_HOMOEOPATHY_CATEGORY_ID || '18',
  textlocal_template_message: process.env.TEXTLOCAL_TEMPLATE_MESSAGE || '{#var#} is your OTP',
  astrologer_test_mobile: process.env.ASTROLOGER_TEST_MOBILE || '9999999999',
  astrologer_test_otp_code: process.env.ASTROLOGER_TEST_OTP_CODE || '123456',
  customer_test_mobile: process.env.CUSTOMER_TEST_MOBILE || '8888888888',
  customer_test_otp_code: process.env.CUSTOMER_TEST_OTP_CODE || '654321',
  sms_gateway_status: process.env.SMS_GATEWAY_ACTIVE === 'true' || process.env.SMS_GATEWAY_ACTIVE === '1' || false,
  default_otp: process.env.DEFAULT_OTP_CODE || '666331',
  custom_sms_url: process.env.CUSTOM_SMS_URL || 'https://2factor.in/API/V1/b254aaa6-e486-11ef-8b17-0200cd936042/SMS/#MOBILENO#/#MESSAGE#/OTP1',
  custom_sms_message: process.env.CUSTOM_SMS_MESSAGE || '#OTP#'
}

export const CURRENCY = {
  default_currency_code: "INR",
  default_currency_symbol: "₹",
  default_exchange_rate: 1,
  dollar_currency_code: "USD",
  dollar_currency_symbol: "$",
  dollar_exchange_rate: 84.0,
};
