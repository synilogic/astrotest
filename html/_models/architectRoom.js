import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ArchitectRoom = sequelize.define('architect_rooms', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  customer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  architect_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  room_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  room_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  room_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  room_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  dimensions: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  floor_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '0=inactive, 1=active'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'architect_rooms',
  timestamps: false
});

export default ArchitectRoom;

