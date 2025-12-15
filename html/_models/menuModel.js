import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Menu = sequelize.define('menus', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  menu_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  menu_slug: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  menu_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  menu_icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  menu_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  menu_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  menu_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'main', // main, footer, sidebar
  },
  target: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: '_self', // _self, _blank
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
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
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'menus',
  timestamps: false,
  indexes: [
    { fields: ['menu_name'] },
    { fields: ['menu_slug'] },
    { fields: ['parent_id'] },
    { fields: ['menu_type'] },
    { fields: ['menu_order'] },
    { fields: ['status'] },
  ],
});

export default Menu;


