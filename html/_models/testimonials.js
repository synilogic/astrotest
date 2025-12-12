import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Testimonial = sequelize.define('testimonials', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'testimonials',
  timestamps: false, // Set to false because you're managing timestamps manually
  indexes: [
    {
      name: 'name_2',
      fields: ['name']
    },
    {
      name: 'status',
      fields: ['status']
    },
    {
      name: 'name',
      fields: ['name', 'designation', 'status']
    }
  ]
});

export default Testimonial;
