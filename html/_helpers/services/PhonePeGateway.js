import crypto from 'crypto';
import axios from 'axios';
import { getConfig } from '../../configStore.js';

export default class PhonePeGateway {
  constructor() {
    this.testMode = getConfig('phonepe_live_mode') !== '1';
    this.merchantId = getConfig('phonepe_merchant_id');
    this.saltKey = getConfig('phonepe_salt_key');
    this.saltIndex = getConfig('phonepe_salt_index');
    // PhonePe API URLs (Correct as per PhonePe documentation)
    // Production Base: https://api.phonepe.com/apis/hermes
    // Sandbox Base: https://api-preprod.phonepe.com/apis/pg-sandbox
    // Full Production URL: https://api.phonepe.com/apis/hermes/pg/v1/pay
    // Full Sandbox URL: https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay
    this.liveHostURL = 'https://api.phonepe.com/apis/hermes';
    this.testHostURL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    
    // Validate and log configuration
    this.validateConfiguration();
  }

  validateConfiguration() {
    const issues = [];
    
    // Check merchant ID
    if (!this.merchantId || this.merchantId.trim() === '') {
      issues.push('Merchant ID is missing');
    } else if (this.merchantId.length < 10) {
      issues.push('Merchant ID seems too short (should be at least 10 characters)');
    }
    
    // Check salt key
    if (!this.saltKey || this.saltKey.trim() === '') {
      issues.push('Salt Key is missing');
    } else if (this.saltKey.length < 20) {
      issues.push('Salt Key seems too short (should be at least 20 characters)');
    }
    
    // Check salt index
    if (!this.saltIndex || this.saltIndex.trim() === '') {
      issues.push('Salt Index is missing');
    } else if (!['1', '2', '3', '4'].includes(this.saltIndex.toString())) {
      issues.push(`Salt Index should be 1, 2, 3, or 4 (got: ${this.saltIndex})`);
    }
    
    // Log configuration with validation results
    console.log('🔧 PhonePe Gateway Configuration:', {
      testMode: this.testMode ? 'TEST (Sandbox)' : 'LIVE (Production)',
      merchantId: this.merchantId 
        ? `${this.merchantId.substring(0, 6)}...${this.merchantId.substring(this.merchantId.length - 4)} (${this.merchantId.length} chars)` 
        : '❌ MISSING',
      saltKey: this.saltKey 
        ? `Present (${this.saltKey.length} chars)` 
        : '❌ MISSING',
      saltIndex: this.saltIndex || '❌ MISSING',
      apiUrl: this.testMode ? this.testHostURL : this.liveHostURL,
      validationIssues: issues.length > 0 ? issues : '✅ All OK'
    });
    
    if (issues.length > 0) {
      console.warn('⚠️ PhonePe Configuration Issues:', issues);
    }
  }

  getHostURL() {
    return this.testMode ? this.testHostURL : this.liveHostURL;
  }

  async requestApp(parameters) {
    try {
      // Validate PhonePe merchant credentials first
      if (!this.merchantId || !this.saltKey || !this.saltIndex) {
        const missingFields = [];
        if (!this.merchantId) missingFields.push('phonepe_merchant_id');
        if (!this.saltKey) missingFields.push('phonepe_salt_key');
        if (!this.saltIndex) missingFields.push('phonepe_salt_index');
        
        console.error('PhonePe Gateway Error: Missing configuration', {
          missingFields,
          merchantId: this.merchantId ? 'Present' : 'Missing',
          saltKey: this.saltKey ? 'Present' : 'Missing',
          saltIndex: this.saltIndex ? 'Present' : 'Missing'
        });
        
        return {
          status: 0,
          msg: `PhonePe payment gateway is not configured. Missing: ${missingFields.join(', ')}. Please configure PhonePe credentials in settings.`,
          error: {
            code: 'GATEWAY_NOT_CONFIGURED',
            message: 'PhonePe merchant credentials are missing',
            missingFields
          }
        };
      }

      const {
        merchantTransactionId,
        merchantUserId,
        amount,
        redirectUrl,
        callbackUrl,
        mobileNumber = '',
        is_updated = 0,
      } = parameters;

      if (!merchantTransactionId || !redirectUrl || !callbackUrl || !amount || amount <= 0) {
        return {
          status: 0,
          msg: 'Invalid parameters provided',
        };
      }

      const amountInPaise = Math.round(amount * 100);

      // Create the payload according to PhonePe API v1
      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: merchantUserId,
        amount: amountInPaise,
        redirectUrl: redirectUrl,
        redirectMode: 'POST',
        callbackUrl: callbackUrl,
        mobileNumber: mobileNumber,
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      // Encode the payload to base64
      const encodedData = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // PhonePe API endpoint path (Full path required)
      // Production: /pg/v1/pay
      // Sandbox: /pg/v1/pay
      const apiPath = '/pg/v1/pay';
      
      // PhonePe Signature Verification Format:
      // IMPORTANT: For signature, we need the FULL path: /pg/v1/pay
      // stringToHash = base64(payload) + /pg/v1/pay + saltKey
      // X-VERIFY = SHA256(stringToHash) + "###" + saltIndex
      const signaturePath = '/pg/v1/pay'; // Full path for signature calculation
      const stringToHash = `${encodedData}${signaturePath}${this.saltKey}`;
      
      // Validate salt key is not empty
      if (!this.saltKey || this.saltKey.trim() === '') {
        console.error('❌ PhonePe Salt Key is empty or invalid');
        return {
          status: 0,
          msg: 'PhonePe salt key is not configured properly',
          error: {
            code: 'INVALID_SALT_KEY',
            message: 'Salt key is missing or empty'
          }
        };
      }
      
      // Validate salt index
      if (!this.saltIndex || this.saltIndex.trim() === '') {
        console.error('❌ PhonePe Salt Index is empty or invalid');
        return {
          status: 0,
          msg: 'PhonePe salt index is not configured properly',
          error: {
            code: 'INVALID_SALT_INDEX',
            message: 'Salt index is missing or empty'
          }
        };
      }
      
      // Create SHA256 hash
      const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
      const finalXHeader = `${sha256}###${this.saltIndex}`;
      
      // Log signature details for debugging (without exposing sensitive data)
      console.log('🔐 PhonePe Signature Details:', {
        signaturePath: signaturePath, // Full path used in signature
        apiPath: apiPath, // Endpoint path for API call
        stringToHashLength: stringToHash.length,
        stringToHashPreview: `${stringToHash.substring(0, 50)}...${stringToHash.substring(stringToHash.length - 20)}`,
        sha256Hash: sha256,
        saltIndex: this.saltIndex,
        finalXHeader: finalXHeader,
        saltKeyLength: this.saltKey.length,
        saltKeyPreview: `${this.saltKey.substring(0, 4)}...${this.saltKey.substring(this.saltKey.length - 4)}`
      });

      const apiUrl = `${this.getHostURL()}${apiPath}`;
      
      console.log('📤 PhonePe API Request:', {
        url: apiUrl,
        mode: this.testMode ? 'TEST (Sandbox)' : 'LIVE (Production)',
        merchantId: this.merchantId,
        merchantTransactionId: merchantTransactionId,
        amount: amountInPaise,
        amountInRupees: amount,
        apiPath: apiPath,
        hasSaltKey: !!this.saltKey,
        saltIndex: this.saltIndex
      });
      
      console.log('📋 PhonePe Request Details:', {
        payload: {
          ...payload,
          merchantId: payload.merchantId // Show full merchant ID for debugging
        },
        encodedDataLength: encodedData.length,
        checksumPrefix: finalXHeader.substring(0, 20) + '...'
      });

      // Make API call to PhonePe
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-VERIFY': finalXHeader,
        'Accept': 'application/json'
      };
      
      console.log('📡 PhonePe API Call:', {
        method: 'POST',
        url: apiUrl,
        headers: {
          'Content-Type': requestHeaders['Content-Type'],
          'X-VERIFY': `${finalXHeader.substring(0, 20)}...###${this.saltIndex}`,
          'Accept': requestHeaders['Accept']
        },
        requestBody: {
          request: encodedData.substring(0, 100) + '...' // Show preview only
        }
      });
      
      const response = await axios.post(apiUrl, {
        request: encodedData
      }, {
        headers: requestHeaders,
        timeout: 30000 // 30 seconds timeout
      });

      console.log('PhonePe API Response:', response.data);
      console.log('PhonePe API Response Status:', response.status);
      console.log('PhonePe API Response Headers:', response.headers);

      if (response.data && response.data.success && response.data.data) {
        const responseData = response.data.data;
        
        console.log('✅ PhonePe Payment Initiated Successfully');
        
        return {
          status: 1,
          msg: 'Payment initiated successfully',
          data: {
            merchantId: this.merchantId,
            merchantTransactionId: merchantTransactionId,
            amount: amountInPaise,
            redirectUrl: responseData.instrumentResponse?.redirectInfo?.url || redirectUrl,
            paymentUrl: responseData.instrumentResponse?.redirectInfo?.url,
            transactionId: responseData.transactionId,
            code: responseData.code,
            message: responseData.message
          }
        };
      } else {
        // PhonePe API returned error response
        const errorData = response.data || {};
        console.error('❌ PhonePe API Error Response:', {
          success: errorData.success,
          code: errorData.code,
          message: errorData.message,
          fullResponse: errorData
        });
        
        return {
          status: 0,
          msg: errorData.message || 'Payment initiation failed',
          error: errorData
        };
      }

    } catch (error) {
      // Network error or exception during API call
      console.error('❌ PhonePe API Exception:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      return {
        status: 0,
        msg: 'Payment gateway error. Please try again.',
        error: error.response?.data || { message: error.message }
      };
    }
  }

  async response(req) {
    try {
      const { 
        merchantTransactionId, 
        transactionId, 
        amount, 
        responseCode, 
        responseMessage,
        status,
        paymentInstrument
      } = req.body;

      console.log('PhonePe Response Data:', req.body);

      // Validate the response
      if (!merchantTransactionId) {
        return {
          status: 0,
          msg: 'Invalid response from PhonePe'
        };
      }

      // Check if payment was successful
      const isSuccess = status === 'PAYMENT_SUCCESS' || 
                       responseCode === 'PAYMENT_SUCCESS' ||
                       (paymentInstrument && paymentInstrument.type === 'PAY_PAGE' && status === 'SUCCESS');

      return {
        status: isSuccess ? 1 : 0,
        transactionId: transactionId,
        order_status: isSuccess ? 'Success' : 'Failed',
        msg: isSuccess ? 'Payment successful' : (responseMessage || 'Payment failed'),
        responseCode: responseCode,
        responseMessage: responseMessage,
        amount: amount
      };

    } catch (error) {
      console.error('PhonePe Response Error:', error);
      return {
        status: 0,
        msg: 'Error processing PhonePe response'
      };
    }
  }
}
