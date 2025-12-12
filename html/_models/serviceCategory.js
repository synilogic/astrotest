import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ServiceCategory = sequelize.define('service_categories', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  meta_key: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meta_title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'service_categories',
  timestamps: false, // managed manually via created_at and updated_at
  indexes: [
    {
      name: 'parent_id',
      fields: ['parent_id']
    },
    {
      name: 'title',
      fields: ['title']
    },
    {
      name: 'status',
      fields: ['status']
    },
    {
      name: 'slug_status',
      fields: ['slug', 'status']
    },
    {
      name: 'id_title_status',
      fields: ['id', 'title', 'status']
    }
  ]
});

export default ServiceCategory;
