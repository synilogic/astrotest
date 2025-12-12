import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const groupPujaCategory = sequelize.define('group_puja_categories', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  parent_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
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
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: 'slug_2'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
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
  tableName: 'group_puja_categories',
  timestamps: false,
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
      name: 'slug_2',
      unique: true,
      fields: ['slug']
    },
    {
      name: 'status',
      fields: ['status']
    },
    {
      name: 'slug',
      fields: ['slug', 'status']
    },
    {
      name: 'id',
      fields: ['id', 'title', 'status']
    }
  ]
});

export default groupPujaCategory;
