import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const Language = sequelize.define('languages', {

 id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      language_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
      tableName: 'languages',
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
          name: 'language_name',
          fields: ['language_name'],
        },
        {
          name: 'status',
          fields: ['status'],
        },
      ],
    

});
export default Language;