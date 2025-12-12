import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const AskQuestion = sequelize.define('AskQuestion', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  customer_uni_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  order_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  answer_status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
  payment_status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ask_questions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default AskQuestion;
