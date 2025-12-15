import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const CustomerRefund = sequelize.define('CustomerRefund', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  unique_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '0',
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
  tableName: 'customer_refunds',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['unique_id'] },
    { fields: ['status'] },
  ],
});

export default CustomerRefund;

