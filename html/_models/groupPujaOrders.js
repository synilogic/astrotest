import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const GroupPujaOrder = sequelize.define('GroupPujaOrder', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  group_puja_assign_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  group_puja_date: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  group_puja_time: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  group_puja_channel_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  cust_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  place: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  gotra: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'pending',
  },
  payment_status: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'unpaid',
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
  },
}, {
  tableName: 'group_puja_orders',
  timestamps: false,
  indexes: [
    { fields: ['group_puja_assign_id'] },
    { fields: ['customer_uni_id'] },
    { fields: ['astrologer_uni_id'] },
    { fields: ['order_id'] },
    { fields: ['group_puja_date'] },
    { fields: ['status'] },
  ],
});

export default GroupPujaOrder;

