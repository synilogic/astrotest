import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const AstrologerPrice = sequelize.define('astrologer_prices', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: true,
  },
  actual_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  time_in_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'INR',
  },
  trash: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'astrologer_prices',
  timestamps: false,
  indexes: [
    {
      name: 'PRIMARY',
      unique: true,
      using: 'BTREE',
      fields: ['id'],
    },
    {
      name: 'astrologer_uni_id',
      using: 'BTREE',
      fields: ['astrologer_uni_id'],
    },
    {
      name: 'type',
      using: 'BTREE',
      fields: ['type'],
    },
    {
      name: 'price',
      using: 'BTREE',
      fields: ['price'],
    },
    {
      name: 'currency',
      using: 'BTREE',
      fields: ['currency'],
    },
    {
      name: 'astrologer_uni_id_2',
      using: 'BTREE',
      fields: ['astrologer_uni_id'],
    },
    {
      name: 'astrologer_uni_id_3',
      unique: true,
      using: 'BTREE',
      fields: ['astrologer_uni_id', 'type', 'currency'],
    },
    {
      name: 'astrologer_uni_id_compound',
      using: 'BTREE',
      fields: ['id', 'astrologer_uni_id', 'type', 'price', 'currency'],
    },
  ],
});

export default AstrologerPrice;
