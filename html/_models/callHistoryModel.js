import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const CallHistory = sequelize.define('CallHistory', {
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
    type: DataTypes.STRING,
    allowNull: true,
  },
  uniqeid: {
    type: DataTypes.STRING(200),
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
    defaultValue: '0',
  },
  charge: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  recording: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  channel_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  waiting_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
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
    defaultValue: 0,
  },
  is_review: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  status: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  refund_valid_date: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'call_history',
  timestamps: false, // manually managed
  indexes: [
    { fields: ['customer_uni_id'] },
    { fields: ['astrologer_uni_id'] },
    { fields: ['call_type'] },
    { fields: ['uniqeid'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    { fields: ['id', 'astrologer_uni_id', 'status'] },
    { fields: ['id', 'customer_uni_id', 'status'] },
    { fields: ['id', 'customer_uni_id', 'astrologer_uni_id', 'uniqeid', 'call_type', 'waiting_time', 'status', 'created_at'] },
  ],
});

export default CallHistory;
