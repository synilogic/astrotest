import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const OpenAIProfile = sequelize.define('open_ai_profiles', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  customer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  dob: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tob: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  pob: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  lat: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  lon: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  lang: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  is_selected: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  is_self_profile: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
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
  },
}, {
  tableName: 'open_ai_profiles',
  timestamps: false,
  indexes: [
    { name: 'customer_uni_id', fields: ['customer_uni_id'] },
    { name: 'status', fields: ['status'] },
    { name: 'is_self_profile', fields: ['is_self_profile'] },
    { name: 'created_at', fields: ['created_at'] },
  ],
});

export default OpenAIProfile;
