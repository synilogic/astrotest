import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Suggestion = sequelize.define('suggestions', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_uni_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  created_at: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: 'suggestions',
  timestamps: false
});

export default Suggestion;
