import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const GroupPujaAssignModel = sequelize.define('group_puja_assigns', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  group_puja_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  group_puja_date: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  group_puja_time: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  group_puja_channel_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  available_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  start_time: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_puja_assigns',
  timestamps: false,
  indexes: [
    {
      name: 'group_puja_id',
      fields: ['group_puja_id']
    },
    {
      name: 'astrologer_uni_id',
      fields: ['astrologer_uni_id']
    },
    {
      name: 'price',
      fields: ['price']
    },
    {
      name: 'status',
      fields: ['status']
    }
  ]
});

export default GroupPujaAssignModel;
