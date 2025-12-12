import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const FollowersModel = sequelize.define('followers', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  user_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0
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
  },
}, {
  tableName: 'followers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'astrologer_uni_id',
      fields: ['astrologer_uni_id']
    },
    {
      name: 'user_uni_id',
      fields: ['user_uni_id']
    },
    {
      name: 'status',
      fields: ['status']
    }
  ]
});
export default FollowersModel;












