import sequelize from '../_config/db.js';
import { Op, Sequelize, literal,QueryTypes } from 'sequelize';
import moment from 'moment';
import Intake from '../_models/IntakeModel.js';
import User from "../_models/users.js";
import Customer from "../_models/customers.js";
import CallHistory from "../_models/call_history.js";
import ServiceOrder from "../_models/serviceOrder.js";
import { ROLE_IDS,configData,constants ,ai_astrologer_category} from '../_config/constants.js';
import dayjs from 'dayjs';
import Astrologer from "../_models/astrologers.js";
import Wallet from "../_models/wallet.js";
import SlotSchedule from "../_models/slot_schedules.js";
import Follower from "../_models/followers.js";
import UserNotification from "../_models/user_notifications.js";
import { generateAgoraRtcToken } from '../_helpers/common.js';
import { getPublicImageUrl, getDefaultCustomerImage } from '../_helpers/imageHelper.js';
import UserActivity from '../_models/user_activity.js'; 

export async function inProgressChatDetailForAstrologer(astrologer_uni_id = '') {
  const details = {
    status: 0,
    call_type: '',
    cust_name: '',
    cust_image: '',
    cust_uni_id: '',
    uniqeid: '',
    channel_name: '',
    token: '',
    charge: 0,
  };

  if (!astrologer_uni_id) return details;

  const call_type_list = ['call', 'chat', 'video'];

  const inProgressCallOrder = await CallHistory.findOne({
    where: {
      astrologer_uni_id,
      status: 'in-progress',
      call_type: call_type_list,
    },
    include: [
      { model: User, as: 'user', attributes: ['name'], required: false },
      { model: Customer, as: 'customer', attributes: ['customer_img'], required: false },
      { model: Intake, as: 'intake', required: false },
    ],
    // order: [['DESC']],
  });
      
  if (inProgressCallOrder) {
                const customer_img =
        getPublicImageUrl(inProgressCallOrder.customer?.customer_img, 'customer') ||
        getDefaultCustomerImage();

    const callType = inProgressCallOrder.call_type;
    details.status = 1;
    details.call_type = callType;
    details.cust_name = inProgressCallOrder.user?.name || '';
    details.cust_image = customer_img;
    details.cust_uni_id = inProgressCallOrder.customer_uni_id;
    details.uniqeid = inProgressCallOrder.uniqeid;
    if (inProgressCallOrder.offer_type !== 3) {
      details.charge = parseFloat(inProgressCallOrder.charge || 0);
    }

    const channelBase = `CHAT/${inProgressCallOrder.customer_uni_id}-${inProgressCallOrder.astrologer_uni_id}`;
    if (callType === 'chat') {
      details.channel_name = channelBase;
    } else if (callType === 'video') {
      details.channel_name = `${channelBase}-Video`;
    } else if (callType === 'call') {
      details.channel_name = `${channelBase}-Call`;
    }

    if (callType === 'video' || callType === 'call') {
      const astrologer = await Astrologer.findOne({
        where: { astrologer_uni_id },
        include: [{ model: User, as: 'user', attributes: ['id'] }],
      });

      if (astrologer?.user?.id) {
        const tokenPayload = {
          uniqeid: inProgressCallOrder.uniqeid,
          user_uni_id: inProgressCallOrder.astrologer_uni_id,
          user_id: astrologer.user.id,
        };
        const agora = await generateAgoraRtcToken(tokenPayload);
        if (agora?.token) {
          details.token = agora.token;
        }
      }
    }

    details.intake = inProgressCallOrder.intake || null;
    return details;
  }

  // No in-progress call — check for active service order
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const activeServiceOrder = await ServiceOrder.findOne({
    where: {
      astrologer_uni_id,
      status: 'approved',
      start_time: { [Op.ne]: null },
    },
    include: [
      { model: User, as: 'user', attributes: ['name'], required: false },
      { model: Customer, as: 'customer', attributes: ['customer_img'], required: false },
    ],
    attributes: {
      include: [
        [Sequelize.literal('UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(start_time)'), 'time_diff'],
        [Sequelize.literal('available_duration * 60'), 'max_duration'],
      ],
    },
    having: Sequelize.literal('UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(start_time) < available_duration * 60'),
    order: [['start_time', 'DESC']],
  });

  if (activeServiceOrder) {
    
    const secondsRemaining =
      activeServiceOrder.available_duration * 60 -
      (currentTimestamp - Math.floor(new Date(activeServiceOrder.start_time).getTime() / 1000));

    if (secondsRemaining > 0) {
            const customer_img =
        getPublicImageUrl(activeServiceOrder.customer?.customer_img, 'customer') ||
        getDefaultCustomerImage();


      details.status = 1;
      details.call_type = 'service_video';
      details.cust_name = activeServiceOrder.user?.name || '';
      details.cust_image = customer_img;
      details.cust_uni_id = activeServiceOrder.customer_uni_id;
      details.uniqeid = activeServiceOrder.order_id;
      details.channel_name = '';
      details.charge = 0;

      const tokenPayload = {
        uniqeid: activeServiceOrder.order_id,
        user_uni_id: activeServiceOrder.astrologer_uni_id,
        user_id: 0,
      };
      const agora = await generateAgoraRtcToken(tokenPayload);
      if (agora?.token) {
        details.token = agora.token;
      }
    }
  }

  return details;
}

export async function astroTotalGiftIncome(uni_id, fromDate = '', toDate = '', type = '') {
  try {
    let query = `
      SELECT ROUND(SUM(amount / exchange_rate), 2) as total
      FROM wallets
      WHERE user_uni_id = :uni_id
        AND transaction_code = 'add_wallet_by_gift'
        AND main_type = 'cr'
        AND status = 1
    `;

    const replacements = { uni_id };

    if (fromDate) {
      query += ' AND DATE(created_at) >= :fromDate';
      replacements.fromDate = fromDate;
    }

    if (toDate) {
      query += ' AND DATE(created_at) <= :toDate';
      replacements.toDate = toDate;
    }

    const [result] = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return result?.total || 0;
  } catch (error) {
    console.error('Error in astroTotalGiftIncome:', error);
    return 0;
  }
}

export async function currentRequestDetailForAstrologer(astrologer_uni_id = '') {
  if (!astrologer_uni_id) return '';

  const call_type_list = ['call', 'chat', 'video'];

  const requestedCallOrder = await CallHistory.findOne({
    where: {
      astrologer_uni_id,
      status: 'request',
      call_type: {
        [Op.in]: call_type_list
      },
      ...(call_type_list.includes('call') && {
        [Op.or]: [
          { call_type: { [Op.ne]: 'call' } },
          { is_inapp_voice_call: 1 }
        ]
      })
    },
    include: [
      { model: User, as: 'user', attributes: ['name'], required: false },
      { model: Customer, as: 'customer', attributes: ['customer_img'], required: false },
      { model: Intake, as: 'intake', required: false }
    ],
    order: [['created_at', 'DESC']],
  });

  return requestedCallOrder?.call_type || '';
}

export async function inProgressIntakeDetailForAstrologer(astrologer_uni_id = '') {
  let details = [];
         
  if (!astrologer_uni_id) return details;

  const inProgressCallOrder = await CallHistory.findOne({
    where: {
      astrologer_uni_id,
      status: {
        [Op.or]: ['request', 'in-progress'],
      },
    },
    include: [
      { model: User, as: 'user', attributes: ['name'], required: false },
      { model: Customer, as: 'customer', attributes: ['customer_img'], required: false },
    ],
    order: [['created_at', 'DESC']],
  });
  
  if (inProgressCallOrder) {
    const uniqeid = inProgressCallOrder.uniqeid;
    const intake_details = await Intake.findOne({ where: { uniqeid } });

    if (intake_details) {
      const custImageUrl =
        getPublicImageUrl(inProgressCallOrder.customer?.customer_img, 'customer') ||
        getDefaultCustomerImage();

      details = {
        ...intake_details.get({ plain: true }),
        status: inProgressCallOrder.status,
        call_type: inProgressCallOrder.call_type,
        cust_name: inProgressCallOrder.user?.name || '',
        cust_image: custImageUrl,
        available_duration: inProgressCallOrder.waiting_time,
      };
    }
  }

  return details;
}

export async function astroIncome(uni_id, fromDate = '', toDate = '', type = '') {
  try {
    const whereClause = {
      user_uni_id: uni_id,
      main_type: 'cr',
      status: 1,
    };

    // Apply date filters with proper time range
    if (fromDate && toDate) {
      // Add time to make it a full day range
      const startDate = `${fromDate} 00:00:00`;
      const endDate = `${toDate} 23:59:59`;
      whereClause.created_at = { [Op.between]: [startDate, endDate] };
    } else if (fromDate) {
      whereClause.created_at = { [Op.gte]: `${fromDate} 00:00:00` };
    } else if (toDate) {
      whereClause.created_at = { [Op.lte]: `${toDate} 23:59:59` };
    }

    // Add debug logging
    console.log('astroIncome query:', {
      uni_id,
      fromDate,
      toDate,
      whereClause
    });

    // Fetch all rows to compute sum manually
    const entries = await Wallet.findAll({
      where: whereClause,
      attributes: ['amount', 'exchange_rate'],
      raw: true,
    });

    console.log('Found entries:', entries.length);

    const total = entries.reduce((sum, entry) => {
      const rate = parseFloat(entry.exchange_rate) || 1;
      const amt = parseFloat(entry.amount) || 0;
      const convertedAmount = Math.round((amt / rate) * 100) / 100;
      return sum + convertedAmount;
    }, 0);

    console.log('Calculated total:', total);
    return total;
  } catch (error) {
    console.error('Error in astroIncome:', error);
    return 0;
  }
}

export const checkRunningSchedule = async (astrologer_uni_id = '') => {
  if (!astrologer_uni_id) return null;

  const currentTime = new Date(); // or use moment() or dayjs() if needed

  const slotSchedule = await SlotSchedule.findOne({
    where: {
      astrologer_uni_id,
      status: 1,
      start_time: { [Op.lte]: currentTime },
      end_time: { [Op.gte]: currentTime }
    },
    include: [
      {
        model: Astrologer,
        as: 'astrologer', // adjust alias if defined differently in association
        required: true
      }
    ]
  });

  return slotSchedule;
};

export const removeQueueList = async (astrologer_uni_id, status, call_type = '') => {
  try {
    if (!astrologer_uni_id || !status) return;

    const whereClause = {
      astrologer_uni_id,
      status: {
        [Op.or]: ['queue', 'queue_request', 'request']
        // If you want to include 'in-progress', add it here
        // [Op.or]: ['queue', 'queue_request', 'request', 'in-progress']
      }
    };

    if (call_type) {
      whereClause.call_type = call_type;
    }

    await CallHistory.update(
      { status }, // field to update
      { where: whereClause }
    );

    // Call helper to clear busy status
    await removeBusyStatus(astrologer_uni_id);

  } catch (error) {
    console.error('Error in removeQueueList:', error);
  }
};

export const removeBusyStatus = async (astrologer_uni_id) => {
  if (!astrologer_uni_id) return;

  try {
    const callHistory = await CallHistory.findAll({
      where: {
        astrologer_uni_id,
        status: {
          [Op.or]: ['queue', 'queue_request', 'request', 'in-progress']
        }
      },
      include: [
        {
          model: User,
          as: 'user', // <-- alias if defined in association
          required: true
        }
      ]
    });

    if (callHistory.length === 0) {
      await Astrologer.update(
        { busy_status: '0' },
        { where: { astrologer_uni_id } }
      );
    }
  } catch (err) {
    console.error('Error in removeBusyStatus:', err);
  }
};


export const userActivityUpdate = async (type = '', user_uni_id = '') => {
  if (!type || !user_uni_id) return true;

  try {
    // Remove '_status' suffix from the type
    const activityType = type.replace('_status', '');

    // Fetch the latest activity that is still ongoing (end_time is null)
    const data = await UserActivity.findOne({
      where: {
        type: activityType,
        user_uni_id,
        end_time: null
      },
      order: [['id', 'DESC']]
    });

    if (data) {
      const currentTime = dayjs();
      const startTime = dayjs(data.start_time);
      const duration = currentTime.diff(startTime, 'second');

      await data.update({
        end_time: currentTime.toDate(),
        type: activityType,
        duration: duration,
        status: 0
      });
    }

    return true;
  } catch (err) {
    console.error('Error in userActivityUpdate:', err);
    return false;
  }
};

export const userActivityCreate = async (type = '', status = '', user_uni_id = '') => {
  if (!type || !user_uni_id) return true;

  try {
    const activityType = type.replace('_status', '');

    const loginData = {
      start_time: dayjs().toDate(),
      type: activityType,
      user_uni_id,
      status: parseInt(status) || 1
    };

    await UserActivity.create(loginData);
    return true;
  } catch (err) {
    console.error('Error in userActivityCreate:', err);
    return false;
  }
};

export const getNotificationToFollowers = async (filter = {}) => {
  try {
    const astrologer = await Astrologer.findOne({
      where: { astrologer_uni_id: filter.astrologer_uni_id },
      include: [
        {
          model: User,
          as: 'user', // adjust alias if needed
          required: true
        }
      ]
    });

    let followers = [];

    if (constants.notification_to_all_customer === 1) {
      // Get all active customers with FCM tokens
      followers = await User.findAll({
        where: {
          status: 1,
          trash: 0,
          is_uninstalled: 0,
          role_id: ROLE_IDS.USER,
          user_fcm_token: { [Op.ne]: null }
        }
      });
    } else {
      // Get specific astrologer's followers
      followers = await Follower.findAll({
        where: {
          astrologer_uni_id: filter.astrologer_uni_id,
          status: 1
        },
        include: [
          {
            model: User,
            as: 'user', // alias based on your association
            required: true,
            where: {
              status: 1,
              trash: 0,
              user_fcm_token: { [Op.ne]: null }
            }
          }
        ]
      });
    }

    // Prepare notification message
    let notificationData = {};
    const displayName = astrologer?.user?.display_name || '';

    if (filter.type === 'live') {
      notificationData = {
        title: displayName ? `🔔 ${displayName} is Live Now! 🔮` : '🔔 Astrologer is Live Now! 🔮',
        description: 'Your favorite astrologer is now live! Join the session to get personalized insights and guidance.',
        image: ''
      };
    } else if (filter.type === 'online') {
      notificationData = {
        title: displayName ? `🔔 ${displayName} is Online Now! 🔮` : '🔔 Astrologer is Online Now! 🔮',
        description: 'Your preferred astrologer is now available for consultations.',
        image: ''
      };
    }

    // Build notification records in batches
    if (followers && followers.length > 0) {
      const notifications = [];
      const batchSize = 1000;

      for (const follower of followers) {
        const user = follower.user || follower; // from join or flat fetch
        if (user.user_fcm_token) {
          notifications.push({
            user_uni_id: user.user_uni_id,
            title: notificationData.title,
            image: notificationData.image,
            msg: notificationData.description,
            status: 0,
            send_status: 0,
            notification_id: 1
          });

          if (notifications.length >= batchSize) {
            await UserNotification.bulkCreate(notifications);
            notifications.length = 0; // reset
          }
        }
      }

      // Insert remaining notifications
      if (notifications.length > 0) {
        await UserNotification.bulkCreate(notifications);
      }
    }
  } catch (err) {
    console.error('Error in getNotificationToFollowers:', err);
  }
};

export const checkOnlineStatus = async (astrologer_uni_id) => {
  try {
    if (!astrologer_uni_id) return;

    // Find astrologer with any of the active statuses
    const astroDetail = await Astrologer.findOne({
      where: {
        astrologer_uni_id,
        [Op.or]: [
          { video_status: '1' },
          { call_status: '1' },
          { chat_status: '1' },
          { live_status: '1' }
        ]
      }
    });

    if (astroDetail) {
      if (astroDetail.online_status === 0 || astroDetail.online_status === '0') {
        await astroDetail.update({ online_status: '1' });
        await userActivityCreate('online_status', '1', astrologer_uni_id);
      }
    } else {
      // Set all statuses to offline if no active session
      await Astrologer.update({
        online_status: '0',
        busy_status: '0',
        no_response_count: '0'
      }, {
        where: { astrologer_uni_id }
      });

      const astroStatusReset = {
        online_status: '0',
        video_status: '0',
        call_status: '0',
        chat_status: '0',
        busy_status: '0',
        live_status: '0',
        no_response_count: '0'
      };

      await removeQueueList(astrologer_uni_id, 'Declined(Astrologer Offline)');

      for (const key of Object.keys(astroStatusReset)) {
        await userActivityUpdate(key, astrologer_uni_id);
      }
    }
  } catch (err) {
    console.error('Error in checkOnlineStatus:', err);
  }
};


export const getAstrologerAssets = (astrologer, filter = {}) => {
  // Convert dummy durations (minutes → seconds)
  astrologer.total_chat_duration =
    +astrologer.total_chat_duration +
    +astrologer.dummy_chat_duration * 60;
  astrologer.total_call_duration =
    +astrologer.total_call_duration +
    +astrologer.dummy_call_duration * 60;
  astrologer.total_video_duration =
    +astrologer.total_video_duration +
    +astrologer.dummy_video_duration * 60;

  delete astrologer.dummy_chat_duration;
  delete astrologer.dummy_call_duration;
  delete astrologer.dummy_video_duration;

  const totalCall =
    Math.floor(astrologer.total_chat_duration) +
    Math.floor(astrologer.total_call_duration) +
    Math.floor(astrologer.total_video_duration);

  let totalOrdersCount =
    (astrologer.total_chat_count || 0) +
    (astrologer.total_call_count || 0) +
    (astrologer.total_video_count || 0) +
    (astrologer.dummy_total_orders || 0);

  const compact = constants.display_count_in_compact_format === 1;

  const formatVal = (val, divide = 60) =>
    compact
      ? numberShorten(val / divide, 0).toString()
      : Math.round(val / divide).toString();

  astrologer.total_call = formatVal(totalCall);
  astrologer.total_chat_duration = formatVal(astrologer.total_chat_duration);
  astrologer.total_call_duration = formatVal(astrologer.total_call_duration);
  astrologer.total_video_duration = formatVal(astrologer.total_video_duration);
  astrologer.total_orders_count = compact
    ? numberShorten(totalOrdersCount, 0).toString()
    : totalOrdersCount.toString();

  // Clean up counts
  delete astrologer.total_call_count;
  delete astrologer.total_chat_count;
  delete astrologer.total_video_count;
  delete astrologer.dummy_total_orders;

  astrologer.follower_count_new = (
    astrologer.follower_count
      ? numberShorten(astrologer.follower_count, 0)
      : 0
  ).toString();

  astrologer.total_waiting_time = Number(astrologer.total_waiting_time) || 0;
  astrologer.total_queue_count = Number(astrologer.total_queue_count) || 0;

  // Flatten category, skill, language names
  astrologer.category_names = astrologer.categories
    ? astrologer.categories.map(c => c.category_title).join(', ')
    : '';
  astrologer.skill_names = astrologer.skills
    ? astrologer.skills.map(s => s.skill_name).join(', ')
    : '';
  astrologer.language_name = astrologer.languages
    ? astrologer.languages.map(l => l.language_name).join(', ')
    : '';

  // Handle reviews
  astrologer.review_count =
    Number(astrologer.review_count) + Number(astrologer.dummy_review_count || 0);

  // const dummyReviews = (astrologer.dummy_reviews || []).slice(
  //   0,
  //   filter.limit || astrologer.dummy_reviews.length
  // );
  // const realReviews = astrologer.reviews
  //   ? astrologer.reviews.slice(0, filter.limit || astrologer.reviews.length)
  //   : [];

  // // const mergedReviews = [...(realReviews?.reverse() || []), ...dummyReviews];
  // const sorted = realReviews
  //   .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  //   .slice(0, 6);

  // const isAnonAstro = filter.user_uni_id?.startsWith('ASTRO');
  // const anonName = constants.anonymous_review_customer_name;

  // astrologer.reviews = sorted.map(review => {
  //   let isAnon = review.customer?.is_anonymous_review === 1;
  //   if (isAnonAstro) isAnon = false;

  //   if (isAnon) {
  //     review.customer.customer_img = config.default_customer_image_path;
  //     review.review_by_user.name = anonName;
  //   }
  //   return review;
  // });

  // delete astrologer.dummy_reviews;
  // delete astrologer.dummy_review_count;

  // Assign service_assigns & blogs (limit)
  astrologer.service_assigns = astrologer.service_assigns || [];

  astrologer.blogs = astrologer.blogs || [];

  // Set flags
  astrologer.is_architect = astrologer.categories?.some(c =>
    c.id === config.architect_category_id
  )
    ? 1
    : 0;
  astrologer.is_electro_homoeopathy = astrologer.categories?.some(c =>
    c.id === config.electro_homoeopathy_category_id
  )
    ? 1
    : 0;

  // Clean up collections
  delete astrologer.categories;
  delete astrologer.skills;
  delete astrologer.languages;

  // Upcoming live
  astrologer.upcoming_live_time = astrologer.upcoming_live || [];
  delete astrologer.upcoming_live;

  // Document images
  const docList = {};
  (astrologer.document_images || []).forEach(img => {
    if (img.document_type === 'Aadhaar Card') {
      docList.aadhaar_card_front = img.front;
      docList.aadhaar_card_back = img.back;
    }
    if (img.document_type === 'Pan Card') {
      docList.pan_card_front = img.front;
      docList.pan_card_back = img.back;
    }
  });
  astrologer.document_image_list = docList;
  delete astrologer.document_images;

  astrologer.ai_astrologer_category = astrologer.ai_astrologer_category
  ? ai_astrologer_category[astrologer.ai_astrologer_category] || ''
  : '';
    // console.log("data from astro assets",astrologer);
     
  return astrologer;
};

// helpers/numberShorten.js
export function numberShorten(num, digits = 0) {
  if (typeof num !== 'number') return '0';

  const lookup = [
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" }
  ];

  for (let i = 0; i < lookup.length; i++) {
    if (num >= lookup[i].value) {
      return (num / lookup[i].value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + lookup[i].symbol;
    }
  }
  return num.toString();
}
