import PaidKundliOrder from '../_models/paidKundliOrderModel.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';
import moment from 'moment';

export const paidKundliOrderList = async (req, res) => {
  const { api_key, user_uni_id, order_for } = req.body;

  if (!api_key || !user_uni_id) {
    return res.status(400).json({
      status: 0,
      msg: 'Missing required fields',
    });
  }

  const isValidUser = await checkUserApiKey(api_key, user_uni_id);
  if (!isValidUser) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    const whereClause = {
      user_uni_id,
      payment_status: 1,
    };

    if (order_for) {
      whereClause.order_for = order_for;
    }

    const orders = await PaidKundliOrder.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      raw: true,
    });
     const host='http://145.223.23.142:8007/'
    const formattedData = orders.map((order) => {
      return {
        ...order,
        reference_id: order.reference_id || '',
        subtotal: parseFloat(order.subtotal).toFixed(2),
        reference_percent: parseFloat(order.reference_percent).toFixed(2),
        reference_amount: parseFloat(order.reference_amount).toFixed(2),
        offer_percent: parseFloat(order.offer_percent).toFixed(2),
        offer_amount: parseFloat(order.offer_amount).toFixed(2),
        pdf_file: order.pdf_file
          ? `${host}${constants.paid_kundli_path}${order.pdf_file}`
          : null,
        payment_status: parseInt(order.payment_status),
        status: parseInt(order.status),
        attempt: parseInt(order.attempt),
        created_at: moment(order.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: moment(order.updated_at).format('YYYY-MM-DD HH:mm:ss'),
      };
    });

    return res.json({
      status: 1,
      data: formattedData,
      msg: 'You are Logged in Successfully',
    });
  } catch (error) {
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong',
      error: error.message,
    });
  }
};
