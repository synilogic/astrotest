import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ApiLog = sequelize.define('api_logs', {

    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    request: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    response: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'api_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_url',
        fields: ['url']
      },
      {
        name: 'idx_status',
        fields: ['status']
      }
    ]
  
});

export default ApiLog;