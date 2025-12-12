import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const QuoteCategoryModel = sequelize.define('quote_categories', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  slug: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  tableName: 'quote_categories',
  timestamps: false, // Set true if you want Sequelize to auto-manage timestamps
  indexes: [
    { name: 'title', fields: ['title'] }, // replicating the index on title
  ],
});

export default QuoteCategoryModel;
