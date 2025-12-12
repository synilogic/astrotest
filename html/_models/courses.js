import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  course_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  video_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  video_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  whatsapp_group_link: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
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
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});
export default Course;