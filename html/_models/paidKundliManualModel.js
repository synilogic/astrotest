import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const PaidKundliManual = sequelize.define('PaidKundliManual', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  paid_kundli_manual_image: DataTypes.STRING,
  marital_status: DataTypes.STRING,
  slug: DataTypes.STRING,
  meta_title: DataTypes.STRING,
  meta_key: DataTypes.STRING,
  meta_description: DataTypes.STRING,
  price: DataTypes.FLOAT,
  report_type: DataTypes.STRING,
  status: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'paid_kundli_manual',
  timestamps: false,
});
