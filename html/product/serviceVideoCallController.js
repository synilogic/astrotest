import moment from 'moment';
import { validationResult, checkSchema } from 'express-validator';
import ServiceOrder from '../_models/serviceOrder.js';
import Customer from '../_models/customers.js';
import Astrologer from '../_models/astrologers.js';
import User from '../_models/users.js';
import {checkUserApiKey,getCustomerById,sendNotification,generateAgoraRtcToken}  from '../_helpers/common.js'

export const serviceVideoCallValidator = checkSchema({
  api_key: { in: ['body'], exists: true, errorMessage: 'api_key is required' },
  user_uni_id: { in: ['body'], exists: true, errorMessage: 'user_uni_id is required' },
  order_id: { in: ['body'], exists: true, errorMessage: 'order_id is required' },
  started_by: { in: ['body'], exists: true, errorMessage: 'started_by is required' },
  notification_status: { in: ['body'], optional: true },
});

export const serviceVideoCall = async (req, res) => {
//   const api = await saveApiLogs(req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map(err => err.msg).join('\n');
    const result = {
      status: 0,
      errors: errors.mapped(),
      message: 'Something went wrong',
      msg,
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const {
    api_key,
    user_uni_id,
    order_id,
    started_by,
    notification_status = 0,
  } = req.body;

  if (!(await checkUserApiKey(api_key, user_uni_id))) {
    const result = {
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  let minutes = 0, second = 0, available = 0;
  const current_time = moment();

  const serviceOrder = await ServiceOrder.findOne({ where: { order_id } });

  if (!serviceOrder) {
    const result = { status: 0, msg: 'Invalid service' };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  if (serviceOrder.status !== 'approved') {
    const result = { status: 0, msg: `Your service is ${serviceOrder.status}` };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const serviceDateTime = moment(`${serviceOrder.date} ${serviceOrder.time}`);
  if (current_time.isBefore(serviceDateTime)) {
    const result = {
      status: 0,
      msg: `Your service video call will start after ${serviceDateTime.format('YYYY-MM-DD HH:mm:ss')}`,
    };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const duration = serviceOrder.available_duration;
  if (!serviceOrder.start_time) {
    await serviceOrder.update({ start_time: current_time.format('YYYY-MM-DD HH:mm:ss') });
    minutes = duration;
    second = duration * 60;
    available = 1;
  } else {
    const startTime = moment(serviceOrder.start_time);
    const timeDiff = current_time.diff(startTime, 'seconds');
    const remainingSeconds = (duration * 60) - timeDiff;
    if (remainingSeconds > 0) {
      second = remainingSeconds;
      minutes = Math.round(second / 60);
      available = 1;
    }
  }

  if (second <= 0) {
    const result = { status: 0, msg: 'Your service time is over' };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  const customer = await getCustomerById(serviceOrder.customer_uni_id);
  const astrologer = await Astrologer.findOne({
    where: { astrologer_uni_id: serviceOrder.astrologer_uni_id },
    include: [{ model: User, as: 'user' }],
    raw: true,
    nest: true,
  });

  let token = '';
  const tokenPayload = {
    uniqeid: order_id,
    user_uni_id: started_by === 'Customer' ? customer.user_uni_id : astrologer.astrologer_uni_id,
    user_id: started_by === 'Customer' ? customer.id : astrologer.user.id,
  };
  const agoraTokenGen = await generateAgoraRtcToken(tokenPayload);
  if (agoraTokenGen?.token) token = agoraTokenGen.token;

  if (!token) {
    const result = { status: 0, msg: 'Oops! Cannot generate token. Please try again' };
    // await updateApiLogs(api, result);
    return res.json(result);
  }

  if (notification_status == 1) {
    const notifyPayload = {
      title: started_by === 'Customer' ? customer.name : astrologer.user.display_name,
      description: 'You Have a Service Video Call Request ...',
      chunk: [started_by === 'Customer' ? astrologer.user.user_fcm_token : customer.user_fcm_token],
      type: 'service_video',
      channelName: process.env.COMPANY_NAME || 'Company',
      user_uni_id: serviceOrder.customer_uni_id,
      astrologer_uni_id: serviceOrder.astrologer_uni_id,
      duration: 0,
      start_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      notification_id: serviceOrder.id,
      cancel_status: 0,
    };
    await sendNotification(notifyPayload);
  }

  const result = {
    status: 1,
    msg: 'Service video call started successfully',
    minutes,
    second,
    available,
    token,
    customer,
    astrologer,
  };

//   await updateApiLogs(api, result);
  return res.json(result);
};
