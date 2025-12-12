import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';


const UserAddress = sequelize.define('UserAddress', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_uni_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
  },
  house_no: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  street_area: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  landmark: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
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
  pincode: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'user_address',
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    {
      name: 'user_uni_id',
      fields: ['user_uni_id', 'status'],
    },
    {
      name: 'user_uni_id_2',
      fields: ['user_uni_id'],
    },
    {
      name: 'status',
      fields: ['status'],
    }
  ],
});
export default UserAddress;