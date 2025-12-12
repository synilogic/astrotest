import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const Wallet = sequelize.define('Wallet', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_uni_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      reference_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gateway_order_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      gateway_payment_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      transaction_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      wallet_history_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      transaction_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      main_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      created_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      admin_percentage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      gst_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      astro_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      admin_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      tds_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      offer_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      gateway_charge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      coupan_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      where_from: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      gift_status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      offer_status: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      currency_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'INR',
      },
      currency_symbol: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: '₹',
      },
      exchange_rate: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 1.0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    }, {
  tableName: 'wallets',
  timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  indexes: [
    { fields: ['user_uni_id'] },
    { fields: ['reference_id'] },
    { fields: ['transaction_code'] },
    { fields: ['main_type'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    {
      name: 'user_uni_id',
      fields: ['user_uni_id', 'reference_id', 'transaction_code', 'main_type', 'status', 'created_at']
    }
  ]
});
export default Wallet;
