import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const PdfBookOrder = sequelize.define('PdfBookOrder', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  pdf_book_id: DataTypes.INTEGER,
  user_uni_id: DataTypes.STRING,
  order_id: DataTypes.STRING,
  subtotal: DataTypes.FLOAT,
  reference_id: DataTypes.STRING,
  reference_percent: DataTypes.FLOAT,
  reference_amount: DataTypes.FLOAT,
  offer_percent: DataTypes.FLOAT,
  offer_amount: DataTypes.FLOAT,
  total_amount: DataTypes.FLOAT,
  status: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'pdf_book_orders',
  timestamps: false,
});

PdfBookOrder.associate = (models) => {
  PdfBookOrder.belongsTo(models.PdfBook, {
    foreignKey: 'pdf_book_id',
    as: 'pdf_book',
  });
};
