// _models/predefinedMessage.js
import { DataTypes } from 'sequelize';
import sequelize from '../_config/db.js';

export const PredefinedMessage = sequelize.define('PredefinedMessage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_uni_id: DataTypes.STRING,
    predefined_message_category_id: DataTypes.INTEGER,
    message: DataTypes.TEXT,
    message_type: DataTypes.STRING,
    created_by: DataTypes.STRING,
    status: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
}, {
    tableName: 'predefined_messages',
    timestamps: false,
});
