// models/pdfBookCategoryModel.js

import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const PdfBookCategory = sequelize.define('PdfBookCategory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: DataTypes.STRING,
  meta_title: DataTypes.STRING,
  meta_key: DataTypes.STRING,
  meta_description: DataTypes.TEXT,
  slug: DataTypes.STRING,
  parent_id: DataTypes.INTEGER,
  image: DataTypes.STRING,
  status: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'pdf_book_categories',
  timestamps: false,
});

PdfBookCategory.associate = (models) => {
  PdfBookCategory.hasMany(models.PdfBook, {
    foreignKey: 'pdf_book_category_id',
    as: 'pdf_books',
  });
};
