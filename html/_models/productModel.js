

import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
import ProductCategory from './productCategoryModel.js';
import ProductGallery from './productGalleryModel.js';

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  vendor_uni_id: DataTypes.STRING,
  product_category_id: DataTypes.INTEGER,
  // product_subcategory_id: DataTypes.INTEGER,
  // product_subcategory_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  product_name: DataTypes.STRING,
  meta_key: DataTypes.STRING,
  meta_title: DataTypes.STRING,
  meta_description: DataTypes.STRING,
  slug: DataTypes.STRING,
  product_image: DataTypes.STRING,
  price: DataTypes.FLOAT,
  gst_percentage: DataTypes.STRING,
  mrp: DataTypes.FLOAT,
  hsn: DataTypes.STRING,
  quantity: DataTypes.INTEGER,
  price_dollar: DataTypes.FLOAT,
  product_image_url: DataTypes.STRING,
  product_description: DataTypes.TEXT,
  status: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
}, {
  tableName: 'products',
  timestamps: false
});

Product.hasMany(ProductGallery, {
  foreignKey: 'product_id',
  as: 'productGallery'
});

// Associations
Product.belongsTo(ProductCategory, {
  foreignKey: 'product_category_id',
  as: 'productcategory'
});



export default Product;
