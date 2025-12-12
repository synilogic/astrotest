import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
import BannerCategory from './banner_categories.js';

const Banner = sequelize.define('banners', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  banner_category_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  subject: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  banner_image: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '1'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'banners',
  timestamps: false,
  indexes: [
    {
      name: 'banner_category_id_2',
      fields: ['banner_category_id']
    },
    {
      name: 'status',
      fields: ['status']
    },
    {
      name: 'created_at',
      fields: ['created_at']
    }
  ]
});

// Optional: Relationship with BannerCategory
// Banner.belongsTo(BannerCategory, {
//   foreignKey: 'banner_category_id',
//   as: 'category'
// });

export default Banner;
