import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const ArchitectServiceOrder = sequelize.define('ArchitectServiceOrder', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_uni_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    architect_uni_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    order_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    where_from: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    uniqeid: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    order_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    order_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    order_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '0',
    },
    charge: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    max_order_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_review: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: 'pending',
    },
    payment_status: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: 'unpaid',
    },
    refund_valid_date: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    offer_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    customer_offline_at: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  }, {
    tableName: 'architect_service_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })

  export default ArchitectServiceOrder;