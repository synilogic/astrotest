import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  number: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'contacts',
  timestamps: false,
  indexes: [
    {
      name: 'name',
      fields: ['name'],
    },
    {
      name: 'email',
      fields: ['email'],
    },
    {
      name: 'number',
      fields: ['number'],
    },
    {
      name: 'subject',
      fields: ['subject'],
    },
    {
      name: 'created_at',
      fields: ['created_at'],
    },
  ],
});

export default Contact;

