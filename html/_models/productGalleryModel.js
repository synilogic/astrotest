

import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ProductGallery = sequelize.define('ProductGallery', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: DataTypes.INTEGER,
  image: DataTypes.STRING,
  status: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
}, {
  tableName: 'product_galleries', // Make sure this matches your table name
  timestamps: false
});

export default ProductGallery;
