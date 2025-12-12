import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const SlotBooking = sequelize.define('slot_bookings', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  astrologer_uni_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customer_uni_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  slot_date: {
    type: DataTypes.STRING,
    allowNull: true
  },
  slot_start: {
    type: DataTypes.STRING,
    allowNull: true
  },
  slot_end: {
    type: DataTypes.STRING,
    allowNull: true
  },
  slot_duration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  charge: {
    type: DataTypes.DECIMAL(16, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  serial_no: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Status of the record: pending, in-progress, completed, cancel'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: sequelize.literal('CURRENT_TIMESTAMP') // Note: used only in raw queries or migrations
  }
}, {
  tableName: 'slot_bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default SlotBooking;
