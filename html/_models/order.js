import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

 const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      vendor_uni_id: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      reference_id: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      user_uni_id: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      address_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sub_total_amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
      },
      gst_percent: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      gst_amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
      },
      admin_percentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      delivery_charge: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
      },
      offer_amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
      },
      reference_amount: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(122),
        allowNull: true,
      },
      payment_status: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'unpaid',
      },
      return_valid_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'order',
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
    { fields: ['order_id'] },
    { fields: ['reference_id'] },
    { fields: ['user_uni_id'] },
    { fields: ['address_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    {
      name: 'id',
      fields: ['id', 'order_id', 'reference_id', 'user_uni_id', 'address_id', 'status', 'created_at']
    }
  ],
    }
  );

  export default Order;