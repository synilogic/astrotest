// _models/predefinedMessageCategoryModel.js
import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const PredefinedMessageCategory = sequelize.define('PredefinedMessageCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: DataTypes.STRING,
  status: DataTypes.INTEGER,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'predefined_message_categories',
  timestamps: false,
});
