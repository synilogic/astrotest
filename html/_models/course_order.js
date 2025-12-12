import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const CourseOrder = sequelize.define('CourseOrder', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  course_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
  },
  user_uni_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  order_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.FLOAT(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  reference_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reference_percent: {
    type: DataTypes.FLOAT(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  reference_amount: {
    type: DataTypes.FLOAT(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  offer_percent: {
    type: DataTypes.FLOAT(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  offer_amount: {
    type: DataTypes.FLOAT(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  total_amount: {
    type: DataTypes.FLOAT(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'course_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});
export default CourseOrder;