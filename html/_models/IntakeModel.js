import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Intake = sequelize.define('Intake', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  user_uni_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uniqeid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  gender: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
  },
  dob: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  tob: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  birth_place: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  marital_status: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  occupation: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  topic: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  other: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  lat: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  long: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  partner_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  partner_gender: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
  },
  partner_dob: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  partner_tob: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  partner_birth_place: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  partner_lat: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  partner_long: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  intake_type: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
  },
}, {
  tableName: 'intakes',
  timestamps: true, // adds createdAt and updatedAt
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Intake;
