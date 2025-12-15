import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Faq = sequelize.define('Faq', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  faq_category_id: {
    type: DataTypes.STRING(11),
    allowNull: false,
  },
  question: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  answer: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
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
  tableName: 'faqs',
  timestamps: false,
  indexes: [
    { fields: ['faq_category_id'] },
    { fields: ['status'] },
  ],
});

export default Faq;

