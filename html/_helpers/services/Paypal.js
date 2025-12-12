
import axios from 'axios';
import crypto from 'crypto';
import { getConfig } from '../../configStore.js';

 class Paypal {
  constructor() {
    this.clientId = getConfig('paypal_client_id');
    this.secretKey = getConfig('paypal_secret_key');
    this.testMode = getConfig('paypal_live_mode') !== '1';

    this.liveHostURL = 'https://api-m.paypal.com';
    this.liveHostURL = 'https://api-m.paypal.com';
    this.testHostURL = 'https://api-m.sandbox.paypal.com';
  }

  getHostURL() {
    return this.testMode ? this.testHostURL : this.liveHostURL;
  }

  async getAccessToken() {
    try {
      const response = await axios.post(
        `${this.getHostURL()}/v1/oauth2/token`,
        new URLSearchParams({ grant_type: 'client_credentials' }),
        {
          auth: {
            username: this.clientId,
            password: this.secretKey,
          },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      return response.data.access_token;
    } catch (err) {
      console.error('PayPal access token error:', err);
      return false;
    }
  }

  async createOrder({ order_id, amount, currency_code, redirectUrl, callbackUrl }) {
    const token = await this.getAccessToken();
    if (!token) {
      return { status: 0, msg: 'Access token not generated' };
    }

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order_id,
          amount: {
            currency_code: currency_code || 'USD',
            value: parseFloat(amount).toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: process.env.COMPANY_NAME || 'YourBrand',
            locale: 'en-US',
            landing_page: 'LOGIN',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: redirectUrl,
            cancel_url: callbackUrl,
          },
        },
      },
    };

    try {
      const response = await axios.post(
        `${this.getHostURL()}/v2/checkout/orders`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { id, status, links } = response.data;
      if (status === 'PAYER_ACTION_REQUIRED') {
        const approvalLink = links.find((link) => link.rel === 'payer-action')?.href;
        return approvalLink
          ? {
              status: 1,
              url: approvalLink,
              order_id: id,
              response: response.data,
              msg: 'Success',
            }
          : { status: 0, msg: 'Approval link not found' };
      } else {
        return { status: 0, msg: 'Unexpected PayPal response status' };
      }
    } catch (err) {
      console.error('PayPal order creation error:', err);
      return { status: 0, msg: 'PayPal order creation failed' };
    }
  }
}

export default Paypal;