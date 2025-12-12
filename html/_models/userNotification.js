import { DataTypes } from "sequelize";
import sequelize from "../_config/db.js"

const UserNotification = sequelize.define('UserNotification', {
  user_uni_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  msg: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // custom_url: {
  //   type: DataTypes.STRING,
  //   allowNull: true
  // },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  send_status: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  notification_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'user_notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default UserNotification
