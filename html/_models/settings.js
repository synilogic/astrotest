import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const SettingModel = sequelize.define('settings', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Set true since it's nullable
  },
  setting_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  setting_label: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'App Play Store Url',
  },
  setting_value: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  input_type: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  setting_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  setting_option: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  defaulte_setting: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  tableName: 'settings',
  timestamps: false,
  indexes: [
    {
      name: 'user_id',
      fields: ['user_id']
    },
    {
      name: 'setting_name',
      fields: ['setting_name']
    },
    {
      name: 'input_type',
      fields: ['input_type']
    },
    {
      name: 'setting_type',
      fields: ['setting_type']
    },
    {
      name: 'defaulte_setting',
      fields: ['defaulte_setting']
    },
    {
      name: 'status',
      fields: ['status']
    }
  ]
});

export default SettingModel;
