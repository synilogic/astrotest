import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Reviews = sequelize.define('reviews', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  review_by_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  review_for_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
 
  review_rating: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  review_comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  review_type: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  uniqeid: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    get() {
      const rawValue = this.getDataValue('created_at');
      if (rawValue) {
        const date = new Date(rawValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      return rawValue;
    }
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    get() {
      const rawValue = this.getDataValue('created_at');
      if (rawValue) {
        const date = new Date(rawValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      return rawValue;
    }
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'review_by_id_2',
      using: 'BTREE',
      fields: ['review_by_id']
    },
    {
      name: 'review_for_id',
      using: 'BTREE',
      fields: ['review_for_id']
    },
    {
      name: 'review_rating',
      using: 'BTREE',
      fields: ['review_rating']
    },
    {
      name: 'review_for_id_2',
      using: 'BTREE',
      fields: ['id', 'review_for_id', 'status']
    },
    {
      name: 'review_by_id_3',
      using: 'BTREE',
      fields: ['id', 'review_by_id', 'status']
    },
    {
      name: 'review_by_id',
      using: 'BTREE',
      fields: ['id', 'review_by_id', 'review_for_id', 'review_rating', 'status']
    }
  ]
});

export default Reviews;

