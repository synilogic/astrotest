import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const AdminChatChannelHistory = sequelize.define('admin_chat_channel_histories', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  channel_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  user_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  uniqeid: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  selected_text: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  selected_type: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  chat_intake_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  file_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  message_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Text'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  trash: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
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
  tableName: 'admin_chat_channel_histories',
  timestamps: false
});

export default AdminChatChannelHistory;
