import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const Service = sequelize.define('services', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  service_category_id: {
    type: DataTypes.INTEGER
  },
  service_name: {
    type: DataTypes.STRING
  },
  slug: {
    type: DataTypes.STRING
  },
  service_image: {
    type: DataTypes.STRING
  },
  service_description: {
    type: DataTypes.TEXT
  },
  created_at: {
    type: DataTypes.DATE
  },
  updated_at: {
    type: DataTypes.DATE
  }
}, {
  timestamps: false
});
