import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const CustomerModel = sequelize.define('customers', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  customer_uni_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  birth_date: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  age: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  customer_img: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cover_img: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  longitude: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  birth_place: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  birth_time: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  latitude: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  time_zone: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_dosha_checked: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  is_pitra_dosha: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  is_manglik_dosh: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  is_kaalsarp_dosh: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  is_anonymous_review: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  process_status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'customers',
  timestamps: false,
  indexes: [
    {
      name: 'PRIMARY',
      unique: true,
      fields: ['id']
    },
    {
      name: 'customer_uni_id',
      fields: ['customer_uni_id']
    },
    {
      name: 'city',
      fields: ['city']
    },
    {
      name: 'state',
      fields: ['state']
    },
    {
      name: 'country',
      fields: ['country']
    },
    {
      name: 'gender',
      fields: ['gender']
    },
    {
      name: 'process_status',
      fields: ['process_status']
    },
    {
      name: 'city_2',
      fields: ['city', 'state', 'country']
    },
    {
      name: 'id',
      fields: ['id', 'customer_uni_id', 'process_status', 'city', 'state', 'country', 'gender']
    }
  ]
});

export default CustomerModel;
