import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ServiceOrder = sequelize.define('service_orders', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  service_assign_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  customer_uni_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  astrologer_uni_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  order_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.FLOAT(10, 0),
    allowNull: true
  },
  available_duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  file_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  payment_status: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'unpaid'
  },
  on_pause: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  refund_valid_date: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'service_orders',
  timestamps: false, 
  indexes: [
    {
      name: 'service_assign_id_2',
      fields: ['service_assign_id']
    },
    {
      name: 'customer_uni_id',
      fields: ['customer_uni_id']
    },
    {
      name: 'astrologer_uni_id',
      fields: ['astrologer_uni_id']
    },
    {
      name: 'order_id',
      fields: ['order_id']
    },
    {
      name: 'status',
      fields: ['status']
    },
    {
      name: 'date',
      fields: ['date']
    },
    {
      name: 'created_at',
      fields: ['created_at']
    },
    {
      name: 'service_assign_id',
      fields: [
        'service_assign_id',
        'customer_uni_id',
        'astrologer_uni_id',
        'order_id',
        'status',
        'date',
        'created_at'
      ]
    }
  ]
});

export default ServiceOrder;
