import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getConfig } from '../../configStore.js';

class RazorpayApi {
  constructor() {
    this.razorpayId = getConfig('razorpay_id');
    this.razorpayKey = getConfig('razorpay_key');
    this.razorpayAccount = getConfig('razorpay_account'); // Optional

    this.instance = new Razorpay({
      key_id: this.razorpayId,
      key_secret: this.razorpayKey,
    });

    // Optional global config
    global.razorpayXConfig = {
      key_id: this.razorpayId,
      key_secret: this.razorpayKey,
    };
    global.jsonMapperType = 'best-fit';
  }

  async createOrderId(data = {}) {
    try {
      if (!data.amount) {
        return {
          status: 0,
          msg: 'Amount field is required',
        };
      }

      const amount = Math.round(data.amount * 100);
      const currency = data.currency || 'INR';
      const receipt = crypto.randomBytes(10).toString('hex');

      const options = {
        amount: amount,
        currency: currency,
        receipt: receipt,
        payment: {
          capture: 'automatic',
          capture_options: {
            automatic_expiry_period: 12,
            manual_expiry_period: 7200,
            refund_speed: 'optimum',
          },
        },
      };

      const order = await this.instance.orders.create(options);

      if (order && order.id) {
        return {
          status: 1,
          orderId: order.id,
          msg: 'Success',
        };
      } else {
        return {
          status: 0,
          msg: 'Something went wrong.',
        };
      }
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        status: 0,
        msg: error.message || 'Failed to create order',
      };
    }
  }



  async fetchOrderId(orderId = '') {
  const result = {};

  if (!orderId) {
    return {
      status: 0,
      msg: 'Order Id is required',
    };
  }

  try {
    const response = await this.instance.orders.fetch(orderId);
    const payments = await this.instance.orders.fetchPayments(orderId);

    return {
      status: 1,
      data: payments.items || [],
      msg: 'Success',
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      status: 0,
      msg: 'Error: ' + (error.message || 'Something went wrong'),
    };
  }
}

}

export default RazorpayApi;
