import { DataTypes } from "sequelize";
import sequelize from "../_config/db.js";
const BlogLike = sequelize.define(
  "BlogLike",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    blog_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_uni_id: {
      type: DataTypes.STRING(11),
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    tableName: "blog_likes",
    timestamps: true,
    indexes: [
      {
        name: "blog_id_2",
        fields: ["blog_id"],
      },
      {
        name: "user_uni_id",
        fields: ["user_uni_id"],
      },
      {
        name: "status",
        fields: ["status"],
      },
      {
        name: "blog_id",
        fields: ["id", "blog_id", "user_uni_id", "status"],
      },
    ],
  }
);
export default BlogLike;
