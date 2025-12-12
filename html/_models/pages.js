import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Pages = sequelize.define('Pages', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  page_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  page_slug: {
    type: DataTypes.STRING,
    allowNull: false
  },
  default_page: {
    type: DataTypes.STRING,
    allowNull: true
  },
  page_images: {
    type: DataTypes.STRING,
    allowNull: true
  },
  page_description: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  page_meta_key: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  page_meta_title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  page_meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Pages;
