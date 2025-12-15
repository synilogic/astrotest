import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  template_code: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
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
  tableName: 'email_templates',
  timestamps: false,
  indexes: [
    { fields: ['title'] },
    { fields: ['template_code'] },
    { fields: ['status'] },
  ],
});

export default EmailTemplate;

