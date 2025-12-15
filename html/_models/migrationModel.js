import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Migration = sequelize.define('migrations', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  migration_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  migration_version: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  batch: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  executed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'completed', // completed, pending, failed, rolled_back
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
  tableName: 'migrations',
  timestamps: false,
  indexes: [
    { fields: ['migration_name'] },
    { fields: ['migration_version'] },
    { fields: ['batch'] },
    { fields: ['status'] },
  ],
});

export default Migration;



