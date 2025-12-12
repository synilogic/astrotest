import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js'; 

const Product = sequelize.define('Product',  {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      vendor_uni_id: {
        type: DataTypes.STRING(11),
        allowNull: true,
      },
      product_category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      product_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      meta_key: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      product_image: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      price: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      gst_percentage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mrp: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      hsn: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price_dollar: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      product_image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      product_description: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
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
  tableName: 'products',
  timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  indexes: [
    { fields: ['vendor_uni_id'] },
    { fields: ['product_category_id	'] },
    { fields: ['price'] },
    { fields: ['product_name'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    {
      name: 'id',
      fields: ['id', 'vendor_uni_id', 'product_category_id', 'product_name', 'price', 'status', 'created_at']
    }
  ]
});
export default Product;