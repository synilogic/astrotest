import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

const Bank  = sequelize.define('banks',  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    astrologer_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    pan_card: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bank_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    account_no: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    account_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ifsc_code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    account_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('created_at');
        if (rawValue) {
          const date = new Date(rawValue);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        return rawValue;
      }
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('updated_at');
        if (rawValue) {
          const date = new Date(rawValue);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        return rawValue;
      }
    }
  }, {
    tableName: 'banks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        name: 'astrologer_id',
        fields: ['astrologer_id']
      },
      {
        name: 'account_no',
        fields: ['account_no']
      },
      {
        name: 'account_type',
        fields: ['account_type']
      },
      {
        name: 'created_at',
        fields: ['created_at']
      }
    ]
  });


export default Bank;
