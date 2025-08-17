// backend/src/models/member.model.ts
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/database";

export class Member extends Model<InferAttributes<Member>, InferCreationAttributes<Member>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare projectId: number;
  declare role: CreationOptional<"owner" | "collaborator">;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Member.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.ENUM("owner", "collaborator"), allowNull: false, defaultValue: "collaborator" },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "members" }
);

export default Member;
