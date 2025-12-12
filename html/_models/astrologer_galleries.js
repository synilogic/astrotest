import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const AstrologerGallery = sequelize.define('astrologer_galleries', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  }
}, {
  tableName: 'astrologer_galleries',
  timestamps: false, // manually managing timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default AstrologerGallery;
