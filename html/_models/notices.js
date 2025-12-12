
import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Notice = sequelize.define('notices', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  notice_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notice_link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notice_for: {
    type: DataTypes.STRING,
    allowNull: true
  },
 
  status: {
    type: DataTypes.STRING,
    defaultValue: '1',
    allowNull: false
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
  tableName: 'notices',
  timestamps: false,
  indexes: [
    {
      name: 'title',
      fields: ['title']
    },
    {
      name: 'status',
      fields: ['status']
    },
    {
      name: 'id_2',
      fields: ['id', 'title', 'status']
    },
    {
      name: 'id',
      fields: ['id', 'status']
    }
  ]
});

export default Notice;
