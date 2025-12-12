import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const AdminApiLog = sequelize.define('admin_api_logs', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  request: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  response: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
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
  tableName: 'admin_api_logs',
  timestamps: false
});

export default AdminApiLog;
