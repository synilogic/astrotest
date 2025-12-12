// import { DataTypes } from 'sequelize';
// import sequelize from '../_config/db.js';

// export const Sanjeevini = sequelize.define('sanjeevinis', {
//   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//   title: { type: DataTypes.STRING },
//   sanjeevini_image: { type: DataTypes.STRING },
//   status: { type: DataTypes.STRING },
// }, {
//   timestamps: false
// });

import { DataTypes } from 'sequelize';
import db from '../_config/db.js';

export const Sanjeevini = db.define('sanjeevinis', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  slug: { type: DataTypes.STRING },
  meta_title: { type: DataTypes.STRING },
  meta_key: { type: DataTypes.STRING },
  meta_description: { type: DataTypes.TEXT },
  price: { type: DataTypes.FLOAT },
  sanjeevini_image: { type: DataTypes.STRING },
  status: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE }
}, {
  tableName: 'sanjeevinis',
  timestamps: false
});
