import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const GroupPujaModel = sequelize.define('group_pujas', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  group_puja_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  group_puja_name: {
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
    unique: true
  },
  group_puja_image: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  group_puja_description: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_pujas',
  timestamps: false,
  indexes: [
    {
      name: 'group_puja_category_id',
      fields: ['group_puja_category_id']
    },
    {
      name: 'group_puja_name',
      fields: ['group_puja_name']
    },
    {
      name: 'status',
      fields: ['status']
    },
    {
      name: 'slug',
      unique: true,
      fields: ['slug']
    },
    {
      name: 'created_at',
      fields: ['created_at']
    }
  ]
});

export default GroupPujaModel;
