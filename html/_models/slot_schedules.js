import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const SlotSchedule = sequelize.define('slot_schedules', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  astrologer_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  start_time: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  end_time: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  slot_date: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  per_slot_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  per_slot_break: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  number_of_slot: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(16, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
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
  tableName: 'slot_schedules',
  timestamps: false,
  indexes: [
    {
      name: 'PRIMARY',
      unique: true,
      fields: ['id']
    },
    {
      name: 'idx_astrologer_uni_id',
      fields: ['astrologer_uni_id']
    },
    {
      name: 'idx_slot_date',
      fields: ['slot_date']
    }
  ]
});

export default SlotSchedule;
