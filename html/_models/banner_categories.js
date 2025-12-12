import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const BannerCategory = sequelize.define('banner_categories', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '1'
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
  tableName: 'banner_categories',
  timestamps: false
});

export default BannerCategory;
