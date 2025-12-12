import axios from 'axios';
import { DateTime } from 'luxon';

class CashfreeGateway {
  constructor() {
    // Since you're using live keys in local development, force live mode
    this.testMode = false; // Always use live mode with your live credentials
    
    this.appId = "7418672a914fdda00e7c408034768147";
    this.secretKey = "cfsk_ma_prod_eb5ea946cde648d401ba41782b41694d_15d263f3";
    
    this.liveHostURL = 'https://api.cashfree.com/pg';
    this.testHostURL = 'https://sandbox.cashfree.com/pg';
    
    console.log(`Cashfree Gateway initialized in ${this.testMode ? 'TEST' : 'LIVE'} mode`);
  }

  getHostURL() {
    return this.testMode ? this.testHostURL : this.liveHostURL;
  }

  getHeaders() {
    return {
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-version': '2023-08-01',
    };
  }

  async request(parameters) {
    try {
      // Validate required parameters
      if (
        !parameters.gateway_order_id ||
        !parameters.returnUrl ||
        !parameters.notifyUrl ||
        !parameters.amount ||
        parameters.amount <= 0
      ) {
        return { status: 0, msg: 'Missing required parameters.' };
      }

      if (parameters.is_updated === 1) {
        return await this.createPaymentLink(parameters);
      }

      const amount = parseFloat(parameters.amount.toFixed(2));
      const order_currency = parameters.currency || 'INR';

      const data = {
        order_amount: amount,
        order_currency,
        order_id: parameters.gateway_order_id,
        customer_details: {
          customer_id: parameters.customer_id || '',
          customer_phone: parameters.customer_phone || '',
          customer_name: parameters.customer_name || '',
          customer_email: parameters.customer_email || '',
        },
        order_meta: {
          return_url: parameters.returnUrl,
          notify_url: parameters.notifyUrl,
        },
      };

      const response = await axios.post(
        `${this.getHostURL()}/orders`,
        data,
        { headers: this.getHeaders() }
      );

      const resData = response.data;

      if (resData.order_status === 'ACTIVE') {
        return { status: 1, response: resData, msg: 'Success' };
      } else if (resData.order_status === 'EXPIRED') {
        return { status: 0, msg: 'Order has expired.' };
      } else {
        return { 
          status: 0, 
          msg: resData.message || 'Order creation failed.' 
        };
      }
    } catch (err) {
      console.error('Cashfree request error:', err.response?.data || err.message || err);
      
      // Return more specific error messages based on the error response
      if (err.response?.data?.message) {
        return { status: 0, msg: err.response.data.message };
      }
      
      return { status: 0, msg: 'Payment gateway error. Please try again.' };
    }
  }

  async createPaymentLink(params) {
    try {
      // Validate required parameters for payment link
      if (
        !params.gateway_order_id ||
        !params.customer_email ||
        !params.customer_name ||
        !params.customer_phone ||
        !params.amount ||
        params.amount <= 0
      ) {
        return { status: 0, msg: 'Missing required parameters for payment link.' };
      }

      const link_amount = parseFloat(params.amount.toFixed(2));
      const link_currency = params.currency || 'INR';
      const link_purpose = params.purpose || 'Wallet Recharge';

      const expiryTime = params.link_expiry_time || DateTime.now().plus({ minutes: 15 }).toISO();

      const data = {
        customer_details: {
          customer_email: params.customer_email,
          customer_name: params.customer_name,
          customer_phone: params.customer_phone,
        },
        link_amount,
        link_currency,
        link_id: params.gateway_order_id,
        link_expiry_time: expiryTime,
        link_meta: {
          notify_url: params.notifyUrl || '', // Fixed: was return_url
          return_url: params.returnUrl || '', // Fixed: was notify_url
        },
        link_purpose,
        link_notify: {
          send_email: true,
          send_sms: false,
        },
      };

      const response = await axios.post(
        `${this.getHostURL()}/links`,
        data,
        { headers: this.getHeaders() }
      );

      const resData = response.data;

      if (resData.link_status === 'ACTIVE') {
        return { status: 1, response: resData, msg: 'Success' };
      } else if (resData.link_status === 'EXPIRED') {
        return { status: 0, msg: 'The payment link has expired.' };
      } else {
        return {
          status: 0,
          msg: resData.message || 'Payment link creation failed.',
        };
      }
    } catch (err) {
      console.error('Cashfree link error:', err.response?.data || err.message || err);
      
      // Return more specific error messages
      if (err.response?.data?.message) {
        return { status: 0, msg: err.response.data.message };
      }
      
      return {
        status: 0,
        msg: 'Payment link creation failed. Please try again.',
      };
    }
  }
}

export default CashfreeGateway;