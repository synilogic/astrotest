import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
import  Astrologer  from './astrologers.js';
import  User  from './users.js';
import { Service } from './service.js';

export const ServiceAssign = sequelize.define('service_assigns', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  service_id: DataTypes.INTEGER,
  astrologer_uni_id: DataTypes.STRING,
  price: DataTypes.FLOAT,
  actual_price: DataTypes.FLOAT,
  description: DataTypes.STRING,
  duration: DataTypes.INTEGER,
  status: DataTypes.INTEGER,
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
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

ServiceAssign.belongsTo(Astrologer, { foreignKey: 'astrologer_uni_id', targetKey: 'astrologer_uni_id', as: 'astrologer' });
ServiceAssign.belongsTo(User, { foreignKey: 'astrologer_uni_id', targetKey: 'user_uni_id', as: 'user' });
// ServiceAssign.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
