import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Member extends Model<InferAttributes<Member>, InferCreationAttributes<Member>> {
  declare id: number;
  declare userId: number;
  declare projectId: number;
  declare role: "owner" | "collaborator";
}

Member.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.ENUM("owner", "collaborator"), allowNull: false, defaultValue: "collaborator" },
  },
  { sequelize, tableName: "members", timestamps: true, indexes: [{ unique: true, fields: ["userId", "projectId"] }] },
);
