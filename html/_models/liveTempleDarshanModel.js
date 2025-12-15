import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const LiveTempleDarshan = sequelize.define('live_temple_darshans', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  temple_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'India',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  live_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  thumbnail_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  schedule_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'live', // live, scheduled, recorded
  },
  start_time: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  end_time: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  is_live: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  viewers_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
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
  tableName: 'live_temple_darshans',
  timestamps: false,
  indexes: [
    { fields: ['temple_name'] },
    { fields: ['city'] },
    { fields: ['is_live'] },
    { fields: ['status'] },
  ],
});

export default LiveTempleDarshan;


