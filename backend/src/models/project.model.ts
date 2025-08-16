import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
  declare id: number;
  declare name: string;
  declare description?: string | null;
  declare ownerId: number;
  declare visibility: "private" | "team";
  declare status: "active" | "archived";
}

Project.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    visibility: { type: DataTypes.ENUM("private", "team"), allowNull: false, defaultValue: "team" },
    status: { type: DataTypes.ENUM("active", "archived"), allowNull: false, defaultValue: "active" },
  },
  { sequelize, tableName: "projects", timestamps: true },
);
