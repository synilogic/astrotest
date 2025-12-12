
// import { DataTypes } from 'sequelize';
// import sequelize from '../config/db.js';

// const ProductCategory = sequelize.define('ProductCategory', {
//   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//   parent_id: { type: DataTypes.INTEGER, allowNull: true },
//   title: DataTypes.STRING,
//   meta_key: DataTypes.STRING,
//   meta_title: DataTypes.STRING,
//   meta_description: DataTypes.STRING,
//   slug: DataTypes.STRING,
//   description: DataTypes.TEXT,
//   image: DataTypes.STRING,
//   status: DataTypes.STRING, // since you're returning it as a string
//   created_at: DataTypes.DATE,
//   updated_at: DataTypes.DATE
// }, {
//   tableName: 'product_categories',
//   timestamps: false
// });

// export default ProductCategory;

import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ProductCategory = sequelize.define('ProductCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  parent_id: DataTypes.INTEGER,
  title: DataTypes.STRING,
  meta_key: DataTypes.STRING,
  meta_title: DataTypes.STRING,
  meta_description: DataTypes.STRING,
  slug: DataTypes.STRING,
  description: DataTypes.TEXT,
  image: DataTypes.STRING,
  status: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
}, {
  tableName: 'product_categories',  // Make sure this matches your table name
  timestamps: false
});

export default ProductCategory;
