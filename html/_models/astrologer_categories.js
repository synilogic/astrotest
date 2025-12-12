// models/astrologer_categories.js
import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const AstrologerCategories = sequelize.define('astrologer_categories', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  category_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  astrologer_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  sort_by_category: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'astrologer_categories',
  timestamps: true, // since created_at and updated_at are handled
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'category_id_index',
      fields: ['category_id'],
    },
    {
      name: 'astrologer_id_index',
      fields: ['astrologer_id'],
    }
  ],
});

export default AstrologerCategories;
