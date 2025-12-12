import { DataTypes } from "sequelize";
import sequelize from "../_config/db.js";

const Vendor = sequelize.define('Vendor', {
  id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    vendor_uni_id: {
      type: DataTypes.STRING(11),
      allowNull: true,
    },
    firm_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    vendor_image: {
      type: DataTypes.STRING(225),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pin_code: {
      type: DataTypes.BIGINT(11),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    gst_no: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    term: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
  }, {
    tableName: 'vendors',
    timestamps: false, // Enable if you have `createdAt`, `updatedAt`
    indexes: [
      {
        name: 'vendor_uni_id',
        fields: ['vendor_uni_id'],
      },
      {
        name: 'firm_name',
        fields: ['firm_name'],
      },
      {
        name: 'slug',
        unique: true,
        fields: ['slug'],
      },
      // Optional: cleanup duplicate index if exists
      // {
      //   name: 'slug_2',
      //   unique: true,
      //   fields: ['slug'],
      // },
    ],
})

export default Vendor;