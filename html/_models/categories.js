import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Category = sequelize.define('categories', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  category_title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category_slug: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category_images: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  featured_status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'categories',
  timestamps: false,
  indexes: [
    {
      name: 'id',
      using: 'BTREE',
      fields: ['id']
    },
    {
      name: 'category_title',
      using: 'BTREE',
      fields: ['category_title']
    },
    {
      name: 'status',
      using: 'BTREE',
      fields: ['status']
    }
  ]
});

export default Category;
