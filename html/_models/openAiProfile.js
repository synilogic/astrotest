import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const OpenAiProfile = sequelize.define('open_ai_profiles', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  customer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  dob: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tob: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  pob: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  lat: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  lon: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  lang: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_selected: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  is_self_profile: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
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
  tableName: 'open_ai_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['customer_uni_id'] },
    { fields: ['is_selected'] },
    { fields: ['status'] }
  ]
});

export default OpenAiProfile;

