import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    service_category_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    service_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    meta_key: {
      type: DataTypes.TEXT,
    },
    meta_title: {
      type: DataTypes.TEXT,
    },
    meta_description: {
      type: DataTypes.TEXT,
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
    },
    price: {
      type: DataTypes.FLOAT(10, 0),
    },
    service_image: {
      type: DataTypes.STRING,
    },
    service_image_url: {
      type: DataTypes.STRING,
    },
    service_description: {
      type: DataTypes.TEXT('long'),
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'services',
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: 'service_name',
        fields: ['service_name'],
      },
      {
        name: 'price',
        fields: ['price'],
      },
      {
        name: 'status',
        fields: ['status'],
      },
      {
        name: 'service_category_id_2',
        fields: ['service_category_id'],
      },
      {
        name: 'service_category_id',
        fields: ['service_category_id', 'service_name', 'price', 'status'],
      },
      {
        name: 'id',
        fields: ['id', 'service_category_id', 'service_name', 'status', 'created_at'],
      },
    ],
  });

  export default Service;