import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const RechargeVoucherModel = sequelize.define('recharge_vouchers', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  wallet_amount: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  },
  gift_amount: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  },
  tag: {
    type: DataTypes.ENUM('none', 'new', 'most popular'),
    allowNull: true,
    defaultValue: 'none'
  },
  currency_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'INR'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'recharge_vouchers',
  timestamps: false,
  indexes: [
    {
      name: 'id',
      fields: ['id']
    },
    {
      name: 'wallet_amount',
      fields: ['wallet_amount']
    },
    {
      name: 'tag',
      fields: ['tag']
    },
    {
      name: 'status',
      fields: ['status']
    }
  ]
});

export default RechargeVoucherModel;
