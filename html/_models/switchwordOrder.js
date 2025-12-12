import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const SwitchWordOrder = sequelize.define('SwitchWordOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  switchword_id: DataTypes.INTEGER,
  user_uni_id: DataTypes.STRING,
  order_id: DataTypes.STRING,
  subtotal: DataTypes.DECIMAL(10, 2),
  reference_id: DataTypes.STRING,
  reference_percent: DataTypes.DECIMAL(5, 2),
  reference_amount: DataTypes.DECIMAL(10, 2),
  offer_percent: DataTypes.DECIMAL(5, 2),
  offer_amount: DataTypes.DECIMAL(10, 2),
  total_amount: DataTypes.DECIMAL(10, 2),
  status: DataTypes.INTEGER,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'switchword_orders',
  timestamps: false,
});

export { SwitchWordOrder };
