import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const UserNotification = sequelize.define('user_notifications', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  msg: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  custom_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  send_status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  notification_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'user_notifications',
  timestamps: false,
  indexes: [
    {
      name: 'PRIMARY',
      unique: true,
      fields: ['id']
    },
    {
      name: 'user_uni_id',
      fields: ['user_uni_id']
    },
    {
      name: 'status',
      fields: ['status']
    },
    {
      name: 'created_at',
      fields: ['created_at']
    }
  ]
});

export default UserNotification;
