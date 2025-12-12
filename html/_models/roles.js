import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const RoleModel = sequelize.define('roles', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role_type: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT,
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
  tableName: 'roles',
  timestamps: false,
  indexes: [
    {
      name: 'roles_name_unique',
      unique: true,
      fields: ['name']
    },
    {
      name: 'status',
      fields: ['status']
    },
    {
      name: 'name',
      fields: ['name']
    }
  ]
});

export default RoleModel;
