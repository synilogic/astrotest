import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const OfflineServiceOrder = sequelize.define('offline_service_orders', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  customer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  service_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  order_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  price: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  remark: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  reference_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  reference_percent: {
    type: DataTypes.DECIMAL(16, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  reference_amount: {
    type: DataTypes.DECIMAL(16, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  offer_percent: {
    type: DataTypes.DECIMAL(16, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  offer_amount: {
    type: DataTypes.DECIMAL(16, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  samagri_status: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  address_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  payment_status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'unpaid'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'offline_service_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['customer_uni_id'] },
    { fields: ['service_id'] },
    { fields: ['order_id'] },
    { fields: ['date'] },
    { fields: ['status'] },
    { fields: ['payment_status'] },
    { fields: ['created_at'] }
  ]
});

export default OfflineServiceOrder;
