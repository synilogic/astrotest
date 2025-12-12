import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const CallHistory = sequelize.define('call_history', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customer_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  call_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'voicecall',
  },
  where_from: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  uniqeid: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  order_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  call_start: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  call_end: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '0',
  },
  charge: {
    type: DataTypes.FLOAT(10, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  original_astro_charge: {
    type: DataTypes.DOUBLE(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  popup_after_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  charge_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  recording: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  channel_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  waiting_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  subscription_assign_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  refund_valid_date: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  offer_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  astrologer_offline_at: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  ref_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  customer_offline_at: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  is_inapp_voice_call: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_exotel_after_inapp: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  is_exotel_after_inapp_done: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  is_astro_online: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  currency_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'INR',
  },
  currency_symbol: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: '₹',
  },
  exchange_rate: {
    type: DataTypes.DECIMAL(16, 2),
    allowNull: false,
    defaultValue: 1.00,
  },
  recording_uid: {
    type: DataTypes.STRING(25),
    allowNull: true,
  },
  recording_sid: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  recording_resource_id: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  waiting_for_request: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ivr_start_from: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ivr_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  is_review: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 1,
  },
  waiting_for_process: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'call_history',
  timestamps: false, // manually handled created_at & updated_at
  indexes: [
    { name: 'PRIMARY', unique: true, using: 'BTREE', fields: ['id'] },
    { name: 'idx_customer_uni_id', using: 'BTREE', fields: ['customer_uni_id'] },
    { name: 'idx_astrologer_uni_id', using: 'BTREE', fields: ['astrologer_uni_id'] },
    { name: 'idx_uniqeid', using: 'BTREE', fields: ['uniqeid'] },
    { name: 'idx_call_type', using: 'BTREE', fields: ['call_type'] },
    { name: 'idx_waiting_time', using: 'BTREE', fields: ['waiting_time'] },
    { name: 'idx_status', using: 'BTREE', fields: ['status'] },
    { name: 'idx_created_at', using: 'BTREE', fields: ['created_at'] },
    { name: 'idx_customer_status', using: 'BTREE', fields: ['customer_uni_id', 'status'] },
    { name: 'idx_astrologer_status', using: 'BTREE', fields: ['astrologer_uni_id', 'status'] },
    {
      name: 'idx_full',
      using: 'BTREE',
      fields: [
        'id',
        'customer_uni_id',
        'astrologer_uni_id',
        'uniqeid',
        'call_type',
        'waiting_time',
        'status',
        'created_at',
      ],
    },
  ],
});

export default CallHistory;
