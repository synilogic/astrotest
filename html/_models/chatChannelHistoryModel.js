import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ChatChannelHistory = sequelize.define('ChatChannelHistory', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  channel_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_uni_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uniqeid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  selected_text: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
  },
  selected_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  chat_intake_data: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  call_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'chat',
  },
  message_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Text',
  },
  is_assistant_chat: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  trash: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'chat_channel_histories',
  timestamps: false,
  // createdAt:  "created_at",
  indexes: [
    {
      name: 'channel_name',
      fields: ['channel_name'],
    },
    {
      name: 'user_uni_id',
      fields: ['user_uni_id'],
    },
    {
      name: 'uniqeid',
      fields: ['uniqeid'],
    },
    {
      name: 'created_at',
      fields: ['created_at'],
    },
    {
      name: 'id',
      fields: ['id', 'channel_name', 'user_uni_id', 'uniqeid', 'created_at'],
    },
  ],
});

export default ChatChannelHistory;
