// models/serviceOrder.model.js
import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const ServiceOrder = sequelize.define('ServiceOrder', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  service_assign_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  customer_uni_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  astrologer_uni_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  available_duration: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  payment_status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unpaid',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'service_orders',
  timestamps: false,
});
