import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const AstrologerDiscountAssign = sequelize.define('astrologer_discount_assigns', {

id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  astrologer_discount_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  start_from: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  end_at: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  discount_percent: {
    type: DataTypes.DOUBLE(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  call_status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  chat_status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  video_status: {
    type: DataTypes.TINYINT,
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
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    // `onUpdate` isn't needed in Sequelize, it auto-handles if timestamps: true
  }
}, {
  tableName: 'astrologer_discount_assigns',
  timestamps: false, // Keep this false only if you manually manage timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at'


});
export default AstrologerDiscountAssign;