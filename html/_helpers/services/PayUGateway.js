import axios from 'axios';
import qs from 'querystring';
import { getConfig } from '../../configStore.js';
import crypto from 'crypto';


class PayUGateway {
  constructor() {
    this.testMode = 1!== 1;
    this.clientId ="9ca219e5181d7ff2168439fe6e31a3512b1cd77b1846981daada259b0d67f91b";
    this.clientSecret ="c9360fc0603785556a389131ecc354edbf5930767802ac57b7febdd7aa05f5df";
    this.merchantId = "12848039";

    this.liveHostURL = 'https://oneapi.payu.in';
    this.testHostURL = 'https://uatoneapi.payu.in';
    this.liveTokenHostURL = 'https://accounts.payu.in';
    this.testTokenHostURL = 'https://uat-accounts.payu.in';
  }
  getHostURL() {
    return this.testMode ? this.testHostURL : this.liveHostURL;
  }

  getTokenHostURL() {
    return this.testMode ? this.testTokenHostURL : this.liveTokenHostURL;
  }

  async getAccessToken() {
    try {
      const response = await axios.post(
        `${this.getTokenHostURL()}/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'create_payment_links',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data.access_token || null;
    } catch (error) {
      console.error('PayU getAccessToken error:', error.response?.data || error.message);
      return null;
    }
  }

  async generatePaymentLink(params) {
    const {
      gateway_order_id,
      amount,
      successURL,
      failureURL,
      currency,
      customer_name,
      customer_phone,
      customer_email,
      description = 'Wallet Recharge',
    } = params;

    if (!gateway_order_id || !amount || amount <= 0) {
      return { status: 0, msg: 'Invalid parameters' };
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return { status: 0, msg: 'Unable to get PayU access token' };
    }

    const requestData = {
      subAmount: String(amount),
      invoiceNumber: gateway_order_id,
      currency,
      customer: {
        name: customer_name,
        phone: customer_phone,
        email: customer_email,
      },
      udf: { udf1: gateway_order_id },
      description,
      source: 'API',
      isAmountFilledByCustomer: false,
      successURL,
      failureURL,
    };

    try {
      const response = await axios.post(
        `${this.getHostURL()}/payment-links`,
        requestData,
        {
          headers: {
            'merchantId': this.merchantId,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data?.result?.paymentLink) {
        return {
          status: 1,
          paymentLink: response.data.result.paymentLink,
          msg: 'Payment link generated successfully',
        };
      } else {
        return {
          status: 0,
          msg: response.data?.message || 'Failed to generate payment link',
        };
      }
    } catch (error) {
      console.error('PayU generatePaymentLink error:', error.response?.data || error.message);
      return { status: 0, msg: 'Something went wrong while creating the payment link' };
    }
  }
}

export default PayUGateway;
