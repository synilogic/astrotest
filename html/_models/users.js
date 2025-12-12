import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const UserModel = sequelize.define('users', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  referral_code: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  admin_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  package_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  package_valid_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  password_resets: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  pstr: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  country_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '+91',
  },
  country_name: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'India',
  },
  secondary_phone: {
    type: DataTypes.STRING(25),
    allowNull: true,
  },
  secondary_country_code: {
    type: DataTypes.STRING(25),
    allowNull: true,
  },
  pan_no: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  aadhaar_no: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  avg_rating: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    defaultValue: 0.0,
  },
  welcome_mail: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  is_recharge: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  remember_token: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  user_fcm_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_uninstalled: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  device_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  user_ios_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  firebase_auth_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  trash: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'users',
  timestamps: false,
  indexes: [
    { name: 'role_id', fields: ['role_id'] },
    { name: 'user_uni_id', fields: ['user_uni_id'] },
    { name: 'admin_id', fields: ['admin_id'] },
    { name: 'package_uni_id', fields: ['package_uni_id'] },
    { name: 'package_valid_date', fields: ['package_valid_date'] },
    { name: 'phone', fields: ['phone'] },
    { name: 'name', fields: ['name'] },
    { name: 'email', fields: ['email'] },
    { name: 'username', fields: ['username'], unique: true },
    { name: 'trash', fields: ['trash'] },
    { name: 'status', fields: ['status'] },
    { name: 'created_at', fields: ['created_at'] },
  ],
});

export default UserModel;
