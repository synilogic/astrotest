import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const AstrologerSkill = sequelize.define('astrologer_skills', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  skill_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  astrologer_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'astrologer_skills',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'skill_id_2',
      fields: ['skill_id']
    },
    {
      name: 'astrologer_id',
      fields: ['astrologer_id']
    },
    {
      name: 'skill_id',
      fields: ['id', 'skill_id', 'astrologer_id']
    }
  ]
});

export default AstrologerSkill;
