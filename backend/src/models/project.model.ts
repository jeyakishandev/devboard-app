import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/database";

export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
  declare id: CreationOptional<number>;                     // <= important
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare visibility: CreationOptional<"private" | "public">; // <= important
  declare status: CreationOptional<"active" | "archived">;    // <= important
  declare ownerId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Project.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    visibility: { type: DataTypes.STRING, allowNull: false, defaultValue: "private" }, // <= défaut
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "active" },      // <= défaut
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "Projects" }
);
