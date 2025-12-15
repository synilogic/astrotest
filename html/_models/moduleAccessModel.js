const { DataTypes } = require('sequelize');
const sequelize = require('../_config/db.js');

const ModuleAccess = sequelize.define('module_accesses', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  user_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'user', // user, astrologer, admin
  },
  module_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  module_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  module_key: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  access_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'view', // view, edit, full, restricted
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_granted: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  granted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  granted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
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
  tableName: 'module_accesses',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['user_type'] },
    { fields: ['module_id'] },
    { fields: ['module_key'] },
    { fields: ['access_type'] },
    { fields: ['is_granted'] },
    { fields: ['status'] },
  ],
});

module.exports = ModuleAccess;


