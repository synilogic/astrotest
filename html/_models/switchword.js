// models/switchword.js

import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const SwitchWord = sequelize.define('SwitchWord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  switchword_image: DataTypes.STRING,
  slug: DataTypes.STRING,
  meta_title: DataTypes.STRING,
  meta_key: DataTypes.STRING,
  meta_description: DataTypes.TEXT,
  price: DataTypes.FLOAT,
}, {
  tableName: 'switchwords',
  timestamps: false,
});

export default SwitchWord;
