import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const OfflineServiceAssign = sequelize.define('offline_service_assigns', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  offline_service_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  actual_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
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
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'offline_service_assigns',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['offline_service_category_id'] },
    { fields: ['astrologer_uni_id'] },
    { fields: ['status'] },
    { fields: ['price'] }
  ]
});

export default OfflineServiceAssign;

