import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const City = sequelize.define('City', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  state_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  city_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  city_pincode: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'city',
  timestamps: false, // created_at and updated_at are string fields, not timestamps
});
export default City;