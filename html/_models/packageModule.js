import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const PackageModule = sequelize.define('package_modules', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  package_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  module_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'package_modules',
  timestamps: false,
  indexes: [
    { fields: ['package_id'] },
    { fields: ['module_id'] },
    { fields: ['status'] },
  ],
});

export default PackageModule;
