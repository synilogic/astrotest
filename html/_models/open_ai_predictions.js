import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const OpenAIPrediction = sequelize.define('open_ai_predictions', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  user_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  order_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  astrology_api_response: {
    type: DataTypes.TEXT('long'), // longtext
    allowNull: true,
  },
  question: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  open_ai_response: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  message_type: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'text',
  },
  user_data: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  total_amount: {
    type: DataTypes.DOUBLE(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  open_ai_profile_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
}, {
  tableName: 'open_ai_predictions',
  timestamps: false, // Set to true if you're using Sequelize's automatic timestamps
  indexes: [
    { name: 'user_uni_id', fields: ['user_uni_id'] },
    { name: 'order_id', fields: ['order_id'] },
    { name: 'message_type', fields: ['message_type'] },
    { name: 'open_ai_profile_id', fields: ['open_ai_profile_id'] },
    { name: 'status', fields: ['status'] },
  ],
});

export default OpenAIPrediction;
