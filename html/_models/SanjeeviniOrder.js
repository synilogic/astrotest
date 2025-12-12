import { DataTypes } from 'sequelize';
import db from '../_config/db.js';

export const SanjeeviniOrder = db.define('sanjeevini_orders', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sanjeevini_id: DataTypes.INTEGER,
  user_uni_id: DataTypes.STRING,
  order_id: DataTypes.STRING,
  subtotal: DataTypes.FLOAT,
  reference_id: DataTypes.STRING,
  reference_percent: DataTypes.FLOAT,
  reference_amount: DataTypes.FLOAT,
  offer_percent: DataTypes.FLOAT,
  offer_amount: DataTypes.FLOAT,
  total_amount: DataTypes.FLOAT,
  status: DataTypes.INTEGER,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
}, {
  tableName: 'sanjeevini_orders',
  timestamps: false
});
