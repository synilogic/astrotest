import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const BlogCategory = sequelize.define('BlogCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  meta_title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  meta_key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  meta_description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'blog_categories',
  timestamps: false,
  indexes: [
    {
      name: 'title',
      fields: ['title'],
    },
    {
      name: 'status',
      fields: ['status'],
    },
    {
      name: 'created_at',
      fields: ['created_at'],
    },
    {
      name: 'id',
      fields: ['id', 'title', 'parent_id', 'status', 'created_at'],
    },
  ],
});
export default BlogCategory;