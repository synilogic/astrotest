import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';
const AstrologerSchedule  = sequelize.define('live_schedules', {


 id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    astrologer_uni_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    schedule_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING(365),
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'live_schedules',
    timestamps: false, // manually managing created_at, updated_at
    indexes: [
      { fields: ['astrologer_uni_id'] },
      { fields: ['schedule_type'] },
      { fields: ['date'] },
      { fields: ['time'] },
      { fields: ['status'] }
    ],

});
export default AstrologerSchedule;