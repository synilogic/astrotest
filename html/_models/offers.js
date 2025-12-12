import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const OfferModel = sequelize.define('offers', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  offer_category: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  offer_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  offer_code: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  offer_validity_from: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  offer_validity_to: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  discount: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  minimum_order_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  user_restriction: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  max_order_amount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true
  },
  coupon_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'offers',
  timestamps: false,
  indexes: [
    { name: 'offer_category', fields: ['offer_category'] },
    { name: 'offer_name', fields: ['offer_name'] },
    { name: 'offer_code', fields: ['offer_code'] },
    { name: 'offer_validity_from', fields: ['offer_validity_from'] },
    { name: 'offer_validity_to', fields: ['offer_validity_to'] },
    { name: 'minimum_order_amount', fields: ['minimum_order_amount'] },
    { name: 'user_restriction', fields: ['user_restriction'] },
    { name: 'max_order_amount', fields: ['max_order_amount'] },
    { name: 'status', fields: ['status'] }
  ]
});

export default OfferModel;
