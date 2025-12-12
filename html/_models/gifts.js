import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const GiftModel = sequelize.define('gifts', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  gift_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gift_price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  },
  gift_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('created_at');
      if (rawValue) {
        const date = new Date(rawValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      return rawValue;
    }
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('updated_at');
      if (rawValue) {
        const date = new Date(rawValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      return rawValue;
    }
  }
}, {
  tableName: 'gifts',
  timestamps: false,
  indexes: [
    {
      name: 'gift_name',
      fields: ['gift_name']
    },
    {
      name: 'gift_price',
      fields: ['gift_price']
    },
    {
      name: 'status',
      fields: ['status']
    }
  ]
});

export default GiftModel;
