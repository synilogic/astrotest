import { DataTypes } from "sequelize";
import sequelize from "../_config/db.js";

const offlineServiceCategory = sequelize.define("offline_service_categories", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    meta_key: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    meta_title: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  }, {
    tableName: 'offline_service_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['parent_id']
      },
      {
        fields: ['title']
      },
      {
        fields: ['status']
      },
      {
        fields: ['slug', 'status']
      },
      {
        fields: ['id', 'title', 'status']
      }
    ]
  })

  export default offlineServiceCategory;