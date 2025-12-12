import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const AstrologerSkill = sequelize.define('astrologer_skills', {

     id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      skill_id: {
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
    },
    {
      tableName: 'astrologer_skills',
      timestamps: false, // manually handled timestamps
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          fields: ['id'],
        },
        {
          name: 'skill_id_2',
          fields: ['skill_id'],
        },
        {
          name: 'astrologer_id',
          fields: ['astrologer_id'],
        },
        {
          name: 'skill_id',
          fields: ['id'], // As per your table indexes, this may be redundant; adjust if needed
        },
      ],
    }
);
export default AstrologerSkill;