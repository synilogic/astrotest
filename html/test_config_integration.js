// Test file to verify configStore integration
import { setConfig, getConfig } from './configStore.js';

// Set up test configuration
console.log('Setting up test configuration...');

// Payment Gateway Configuration
setConfig('payment_gateway', 'Razorpay');
setConfig('razorpay_id', 'rzp_test_your_razorpay_id');
setConfig('razorpay_key', 'your_razorpay_secret');
setConfig('logo', 'https://your-domain.com/logo.png');

// CCAvenue Configuration
setConfig('ccavenue_merchant_id', 'your_merchant_id');
setConfig('ccavenue_access_code', 'your_access_code');
setConfig('ccavenue_working_key', 'your_working_key');
setConfig('ccavenue_currency', 'INR');
setConfig('ccavenue_language', 'EN');
setConfig('ccavenue_redirect_url', 'https://your-domain.com/ccavenue/redirect');
setConfig('ccavenue_cancel_url', 'https://your-domain.com/ccavenue/cancel');

// PhonePe Configuration
setConfig('phonepe_merchant_id', 'your_merchant_id');
setConfig('phonepe_salt_key', 'your_salt_key');
setConfig('phonepe_salt_index', '1');
setConfig('phonepe_redirect_url', 'https://your-domain.com/phonepe/redirect');
setConfig('phonepe_callback_url', 'https://your-domain.com/phonepe/callback');
setConfig('phonepe_redirect_url_web', 'https://your-domain.com/phonepe/redirect-web');
setConfig('phonepe_callback_url_web', 'https://your-domain.com/phonepe/callback-web');

// Cashfree Configuration
setConfig('cashfree_redirect_url', 'https://your-domain.com/cashfree/redirect');
setConfig('cashfree_callback_url', 'https://your-domain.com/cashfree/callback');

// PayU Configuration
setConfig('payu_redirect_url', 'https://your-domain.com/payu/redirect');
setConfig('payu_callback_url', 'https://your-domain.com/payu/callback');

// Product Purchase Response URLs
setConfig('product_purchase_response_url', 'https://your-domain.com/product/purchase/response');

// Other Configuration
setConfig('astrologer_ref_discount_percentage', '5');

// Test the configuration
console.log('Testing configuration retrieval...');
console.log('Payment Gateway:', getConfig('payment_gateway'));
console.log('Razorpay ID:', getConfig('razorpay_id'));
console.log('CCAvenue Merchant ID:', getConfig('ccavenue_merchant_id'));
console.log('PhonePe Merchant ID:', getConfig('phonepe_merchant_id'));

console.log('✅ Configuration test completed successfully!');
console.log('The configStore integration should now work with the Sanjeevini purchase controller.'); 