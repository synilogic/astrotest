import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const AdminChatChannel = sequelize.define('admin_chat_channels', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  channel_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  tableName: 'admin_chat_channels',
  timestamps: false
});

export default AdminChatChannel;
