import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const PaidKundliOrder = sequelize.define('PaidKundliOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  user_uni_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  order_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reference_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reference_percent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reference_amount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  offer_percent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  offer_amount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  request_body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  response_body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pdf_file: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  total_amount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  order_for: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  payment_status: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  attempt: {
    type: DataTypes.INTEGER,
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
  tableName: 'paid_kundli_orders',
  timestamps: false, // change to true if Sequelize manages timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default PaidKundliOrder;
