import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const TrainingVideo = sequelize.define('TrainingVideo', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    video_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    user_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('created_at');
          if (rawValue) {
            const date = new Date(rawValue);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          }
          return rawValue;
        }
      },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('updated_at');
          if (rawValue) {
            const date = new Date(rawValue);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          }
          return rawValue;
        }
      },
  }, {
    tableName: 'training_videos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at', 
    underscored: true,
  });