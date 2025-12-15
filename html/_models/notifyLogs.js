import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const NotifyLog = sequelize.define('notify_logs', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  user_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'push' // push, sms, email, in-app
  },
  notification_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  device_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'pending' // pending, sent, failed
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notify_logs',
  timestamps: false,
  indexes: [
    { fields: ['user_uni_id'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

export default NotifyLog;

