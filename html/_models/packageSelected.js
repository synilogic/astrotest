import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const PackageSelected = sequelize.define('package_selecteds', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
  customer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  package_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
  package_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  selected_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  valid_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
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
  tableName: 'package_selecteds',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['customer_uni_id'] },
    { fields: ['package_id'] },
    { fields: ['package_uni_id'] },
    { fields: ['status'] },
    { fields: ['valid_date'] }
  ]
});

export default PackageSelected;

