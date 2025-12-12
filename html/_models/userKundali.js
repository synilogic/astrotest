import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

  const UserKundali = sequelize.define('UserKundali', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_uni_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    kundali_method: {
      type: DataTypes.STRING,
      allowNull: true
    },
    kundali_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    request_body: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    birth_date: {
      type: DataTypes.STRING,
      allowNull: true
    },
    birth_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    birth_place: {
      type: DataTypes.STRING,
      allowNull: true
    },
    latitude: {
      type: DataTypes.STRING,
      allowNull: true
    },
    longitude: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lang: {
      type: DataTypes.STRING(50),
      allowNull: true
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
    tableName: 'user_kundalis',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  export default  UserKundali;
