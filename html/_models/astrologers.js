import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
import Language from './languages.js';


const Astrologer = sequelize.define('astrologers', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  display_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  house_no: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  street_area: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  landmark: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  latitude: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  birth_date: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  pin_code: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  experience: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  existing_website: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  existing_fees: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  associate_temple: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  writing_experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  writing_language: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  writing_details: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  teaching_experience: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  teaching_subject: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  teaching_year: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
  },
  available_gadgets: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  astro_img: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  live_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  video_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  online_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  call_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  chat_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  emergency_video_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  emergency_chat_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  emergency_call_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  busy_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  no_response_count: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  admin_percentage: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  live_permission: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  slot_permission: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  livetoken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  livechannel: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  live_expire: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  live_topic: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  next_request_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  astro_next_online_datetime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  process_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  long_biography: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  tag: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  sort_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ask_question_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  degrees: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  user_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  specialization: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  other_app_profile_link: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  is_verified: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  is_virtual: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  ai_astrologer_category: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  dummy_call_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dummy_chat_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dummy_video_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dummy_total_orders: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'astrologers',
  timestamps: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['astrologer_uni_id'] },
    { fields: ['live_status'] },
    { fields: ['busy_status'] },
    { fields: ['call_status'] },
    { fields: ['online_status'] },
    { fields: ['chat_status'] },
    { fields: ['video_status'] },
    { fields: ['process_status'] },
    {
      fields: ['display_name', 'city', 'state', 'country', 'birth_date', 'gender'],
    },
    {
      name: 'compound_online_status_index',
      fields: [
        'astrologer_uni_id',
        'online_status',
        'sort_by',
        'live_status',
        'video_status',
        'call_status',
        'chat_status',
        'process_status',
      ],
    },
  ],
});

Astrologer.belongsToMany(Language, {
  through: 'astrologer_languages',
  foreignKey: 'astrologer_id',
  otherKey: 'language_id',
  as: 'astrologerLanguages', // ✅ Use a unique alias
});





export default Astrologer;
