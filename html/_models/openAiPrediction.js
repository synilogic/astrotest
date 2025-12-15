import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const OpenAiPrediction = sequelize.define('open_ai_predictions', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  order_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  astrology_api_response: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  question: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  open_ai_response: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  message_type: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'text'
  },
  user_data: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_amount: {
    type: DataTypes.DOUBLE(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  open_ai_profile_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'open_ai_predictions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_uni_id'] },
    { fields: ['order_id'] },
    { fields: ['status'] }
  ]
});

export default OpenAiPrediction;

