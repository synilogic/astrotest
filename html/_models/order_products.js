import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const OrderProduct = sequelize.define(
  'OrderProduct',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    price: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quality: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'order_products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { name: 'PRIMARY', unique: true, fields: ['id'] },
      { name: 'order_id', fields: ['order_id'] },
      { name: 'product_id', fields: ['product_id'] },
    ],
  }
);

export default OrderProduct;
