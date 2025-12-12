import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const Blog = sequelize.define('Blog', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  blog_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  auth_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'slug_2',
  },
  blog_image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  meta_title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  meta_key: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  total_views: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: '1',
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
  tableName: 'blogs',
  timestamps: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'auth_id_3',
      fields: ['auth_id'],
    },
    {
      name: 'title',
      fields: ['title'],
    },
    {
      name: 'slug_2',
      unique: true,
      fields: ['slug'],
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
      name: 'auth_id',
      fields: ['auth_id', 'title', 'status', 'created_at'],
    },
    {
      name: 'auth_id_2',
      fields: ['auth_id', 'title', 'status'],
    },
    {
      name: 'slug',
      fields: ['slug', 'status'],
    },
  ],
});
export default Blog;