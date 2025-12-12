import { DataTypes } from "sequelize";
import sequelize from "../_config/db.js";

const SequenceCode = sequelize.define(
  "SequenceCode",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    sequence_code: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sequence_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "sequence_codes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "sequence_code",
        using: "BTREE",
        fields: ["sequence_code"],
      },
      {
        name: "id_index",
        using: "BTREE",
        fields: ["id"],
      },
    ],
  }
);

export default SequenceCode;
