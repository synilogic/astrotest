import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const State = sequelize.define('State', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  country_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 103,
  },
  state_name: {
    type: DataTypes.STRING(45),
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
  tableName: 'states',
  timestamps: false, // Not using Sequelize's auto timestamps
});
export default State;