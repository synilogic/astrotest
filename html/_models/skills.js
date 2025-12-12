import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const Skill = sequelize.define('skills', {

 id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      skill_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
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
      tableName: 'skills',
      timestamps: false,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          fields: ['id'],
        },
        {
          name: 'id',
          fields: ['id'],
        },
        {
          name: 'skill_name',
          fields: ['skill_name'],
        },
        {
          name: 'status',
          fields: ['status'],
        },
      ],
    


});
export default Skill;