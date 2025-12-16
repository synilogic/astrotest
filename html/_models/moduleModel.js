import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Module = sequelize.define('modules', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  module_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  module_slug: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  module_key: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  module_icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  module_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  module_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'feature', // feature, service, addon, system
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  module_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  is_premium: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  settings: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'modules',
  timestamps: false,
  indexes: [
    { fields: ['module_name'] },
    { fields: ['module_slug'] },
    { fields: ['module_key'] },
    { fields: ['module_type'] },
    { fields: ['parent_id'] },
    { fields: ['is_active'] },
    { fields: ['status'] },
  ],
});

export default Module;

