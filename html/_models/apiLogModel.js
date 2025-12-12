import { DataTypes } from 'sequelize';
import db from '../_config/db.js';

const ApiLog = db.define('api_logs', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  request: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export { ApiLog };
