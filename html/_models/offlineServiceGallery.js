import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const OfflineServiceGallery = sequelize.define('offline_service_galleries', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  offline_service_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'offline_service_galleries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['offline_service_id'] },
    { fields: ['status'] }
  ]
});

export default OfflineServiceGallery;
