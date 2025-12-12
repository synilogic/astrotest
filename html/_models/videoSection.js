import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const VideoSection = sequelize.define('video_section', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  video_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'video_section',
  timestamps: false,
  indexes: [
    {
      name: 'status',
      fields: ['status']
    }
  ]
});

export default VideoSection;
