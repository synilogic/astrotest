import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ApiKeyModel = sequelize.define('api_keys', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  api_key: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  user_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  expires_at: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'api_keys',
  timestamps: false,
  indexes: [
    {
      name: 'api_key_2',
      fields: ['api_key']
    },
    {
      name: 'expires_at',
      fields: ['expires_at']
    },
    {
      name: 'api_key',
      fields: ['api_key', 'user_uni_id', 'expires_at']
    }
  ]
});

export default ApiKeyModel;
