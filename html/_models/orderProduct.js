import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const orderProduct = sequelize.define('orderProduct', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
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
    allowNull: true,
    defaultValue: null,
  },
  quality: {
    type: DataTypes.BIGINT(20),
    allowNull: false,
  },
  total_amount: {
    type: DataTypes.BIGINT(20),
    allowNull: false,
  }
}, {
  tableName: 'order_products',
  timestamps: true, // adds createdAt and updatedAt
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default orderProduct;
