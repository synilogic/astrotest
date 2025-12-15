import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ConnectedUsers = sequelize.define('ConnectedUsers', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '0',
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'connected_users',
  timestamps: false,
  indexes: [
    {
      name: 'astrologer_uni_id',
      fields: ['astrologer_uni_id'],
    },
    {
      name: 'user_id',
      fields: ['user_id'],
    },
    {
      name: 'status',
      fields: ['status'],
    },
  ],
});

export default ConnectedUsers;

