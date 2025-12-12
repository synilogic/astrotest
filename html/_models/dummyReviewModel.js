import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const DummyReview = sequelize.define('DummyReview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  review_for_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  review_rating: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'dummy_reviews',
  timestamps: true
});
