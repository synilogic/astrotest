import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const AstrologerDocument = sequelize.define('astrologer_documents', {
 id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_uni_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      document_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      front: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      back: {
        type: DataTypes.STRING(255),
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
    },
    {
      tableName: 'astrologer_documents',
      timestamps: false,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          fields: ['id'],
        },
        {
          name: 'user_uni_id_2',
          fields: ['user_uni_id'],
        },
        {
          name: 'document_type',
          fields: ['document_type'],
        },
        {
          name: 'user_uni_id',
          fields: ['id'],
        },
      ],
  

});
 export default AstrologerDocument;