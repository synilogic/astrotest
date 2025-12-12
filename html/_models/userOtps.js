import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const UserOtp = sequelize.define('user_otps', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'user_otps',
  timestamps: true,
  createdAt: 'created_at', 
  updatedAt: 'updated_at',   
  indexes: [
    {
      name: 'phone',
      fields: ['phone']
    },
    {
      name: 'expires_at',
      fields: ['expires_at']
    },
    {
      name: 'id',
      fields: ['id', 'phone', 'expires_at']
    }
  ]
});

export default UserOtp;
