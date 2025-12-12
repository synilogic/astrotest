import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const PaidKundliManualOrder = sequelize.define('PaidKundliManualOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paid_kundli_manual_id: DataTypes.INTEGER,
  user_uni_id: DataTypes.STRING,
  order_id: DataTypes.STRING,
  subtotal: DataTypes.FLOAT,
  reference_id: DataTypes.STRING,
  reference_percent: DataTypes.FLOAT,
  reference_amount: DataTypes.FLOAT,
  offer_percent: DataTypes.FLOAT,
  offer_amount: DataTypes.FLOAT,
  request_body: DataTypes.TEXT,
  response_body: DataTypes.TEXT,
  pdf_file: DataTypes.STRING,
  total_amount: DataTypes.FLOAT,
  report_type: DataTypes.STRING,
  order_for: DataTypes.STRING,
  status: DataTypes.STRING,
  payment_status: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'paid_kundli_manual_orders',
  timestamps: false,
});
