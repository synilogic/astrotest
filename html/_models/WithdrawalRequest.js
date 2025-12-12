import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const WithdrawalRequestModel = sequelize.define('withdrawal_requests', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_uni_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  transaction_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  request_amount: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  request_message: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  send_amount: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  send_message: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  proof_img: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE(6),
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE(6),
    allowNull: true
  }
}, {
  tableName: 'withdrawal_requests',
  timestamps: false,
  indexes: [
    {
      name: 'transaction_number',
      fields: ['transaction_number']
    },
    {
      name: 'user_uni_id',
      fields: ['user_uni_id']
    },
    {
      name: 'status',
      fields: ['status']
    }
  ]
});

export default WithdrawalRequestModel;
