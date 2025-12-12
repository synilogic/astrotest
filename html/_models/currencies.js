import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const CurrencyModel = sequelize.define('currencies', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  currency_code: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  currency_symbol: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  country_code: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  exchange_rate: {
    type: DataTypes.DECIMAL(16, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  default_status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'currencies',
  timestamps: false,
  indexes: [
    {
      name: 'currency_code',
      fields: ['currency_code']
    },
    {
      name: 'status',
      fields: ['status']
    }
  ]
});

export default CurrencyModel;
