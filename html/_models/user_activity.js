import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const UserActivity = sequelize.define('user_activity', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_activity',
  timestamps: false,
  indexes: [
    {
      name: 'PRIMARY',
      unique: true,
      fields: ['id']
    },
    {
      name: 'idx_user_uni_id',
      fields: ['user_uni_id']
    },
    {
      name: 'idx_type',
      fields: ['type']
    },
    {
      name: 'idx_status',
      fields: ['status']
    },
    {
      name: 'idx_created_at',
      fields: ['created_at']
    }
  ]
});

export default UserActivity;
