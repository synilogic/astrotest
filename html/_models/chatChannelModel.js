import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ChatChannel = sequelize.define('ChatChannel', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_uni_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  channel_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_assistant_chat: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  openai_thread_id: {
    type: DataTypes.STRING,
    allowNull: true,
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
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
}, {
  tableName: 'chat_channels',
  timestamps: true,
  indexes: [
    {
      name: 'user_uni_id_2',
      fields: ['user_uni_id'],
    },
    {
      name: 'channel_name',
      fields: ['channel_name'],
    },
    {
      name: 'user_uni_id',
      fields: ['user_uni_id', 'channel_name'],
    },
  ],
});

export default ChatChannel;
