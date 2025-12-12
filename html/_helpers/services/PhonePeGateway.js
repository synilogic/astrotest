import crypto from 'crypto';
import axios from 'axios';
import { getConfig } from '../../configStore.js';

export default class PhonePeGateway {
  constructor() {
    this.testMode = getConfig('phonepe_live_mode') !== '1';
    this.merchantId = getConfig('phonepe_merchant_id');
    this.saltKey = getConfig('phonepe_salt_key');
    this.saltIndex = getConfig('phonepe_salt_index');
    this.liveHostURL = 'https://api.phonepe.com/apis/hermes/pg/v1';
    this.testHostURL = 'https://api-preprod.phonepe.com/apis/hermes/pg/v1';
  }

  getHostURL() {
    return this.testMode ? this.testHostURL : this.liveHostURL;
  }

  async requestApp(parameters) {
    try {
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

      // Encode the payload
      const encodedData = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // Create checksum
      const stringToHash = `${encodedData}/pg/v1/pay${this.saltKey}`;
      const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
      const finalXHeader = `${sha256}###${this.saltIndex}`;

      console.log('PhonePe Request Data:', {
        url: `${this.getHostURL()}/pay`,
        payload: payload,
        encodedData: encodedData,
        checksum: finalXHeader
      });

      // Make API call to PhonePe
      const response = await axios.post(`${this.getHostURL()}/pay`, {
        request: encodedData
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': finalXHeader,
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      console.log('PhonePe API Response:', response.data);

      if (response.data && response.data.success && response.data.data) {
        const responseData = response.data.data;
        
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
        return {
          status: 0,
          msg: response.data?.message || 'Payment initiation failed',
          error: response.data
        };
      }

    } catch (error) {
      console.error('PhonePe API Error:', error.response?.data || error.message);
      
      return {
        status: 0,
        msg: 'Payment gateway error. Please try again.',
        error: error.response?.data || error.message
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
