import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const CoverImage = sequelize.define('CoverImage', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  cover_img: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '1',
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
  tableName: 'cover_images',
  timestamps: false,
});

export default CoverImage;

