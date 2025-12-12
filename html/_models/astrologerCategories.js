import { DataTypes } from "sequelize";
import sequelize from "../_config/db.js";

const AstrologerCategory = sequelize.define(
  "astrologer_categories",
  {
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    astrologer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    tableName: "astrologer_categories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default AstrologerCategory;
