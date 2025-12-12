import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const CallHistoryImage = sequelize.define('call_history_images', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  user_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  uniqeid: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  call_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  file_url: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  file_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Image',
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
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
    onUpdate: DataTypes.NOW, // Sequelize does not support `ON UPDATE` directly, handled automatically if `timestamps` is true
  },
}, {
  tableName: 'call_history_images',
  timestamps: false,
  indexes: [
    { name: 'user_uni_id', fields: ['user_uni_id'] },
    { name: 'uniqeid', fields: ['uniqeid'] },
    { name: 'call_type', fields: ['call_type'] },
    { name: 'status', fields: ['status'] },
    { name: 'created_at', fields: ['created_at'] },
  ],
});

export default CallHistoryImage;
