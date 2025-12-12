import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const AstrologerLanguage = sequelize.define('astrologer_languages', {
id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    language_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    astrologer_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'astrologer_languages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
 indexes: [
      {
        name: 'PRIMARY', // Primary key index
        unique: true,
        fields: ['id'],
        type: 'BTREE',
      },
      {
        name: 'language_id_2', // Index for language_id
        unique: false,
        fields: ['language_id'],
        type: 'BTREE',
      },
      {
        name: 'astrologer_id', // Index for astrologer_id
        unique: false,
        fields: ['astrologer_id'],
        type: 'BTREE',
      },
      {
        name: 'language_id', // Index for language_id again (for clarity, not usually necessary to repeat)
        unique: false,
        fields: ['language_id'],
        type: 'BTREE',
      }
    ]






});
export default AstrologerLanguage;