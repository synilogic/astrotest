// models/pdfBookModel.js

import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const PdfBook = sequelize.define('PdfBook', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  pdf_book_category_id: DataTypes.INTEGER,
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  pdf_image: DataTypes.STRING,
  sample_pdf: DataTypes.STRING,
  main_pdf: DataTypes.STRING,
  slug: DataTypes.STRING,
  meta_title: DataTypes.STRING,
  meta_key: DataTypes.STRING,
  meta_description: DataTypes.TEXT,
  price: DataTypes.FLOAT,
  status: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'pdf_books',
  timestamps: false,
});

PdfBook.associate = (models) => {
  PdfBook.belongsTo(models.PdfBookCategory, {
    foreignKey: 'pdf_book_category_id',
    as: 'category',
  });

  PdfBook.hasMany(models.PdfBookOrder, {
    foreignKey: 'pdf_book_id',
    as: 'orders',
  });
};
