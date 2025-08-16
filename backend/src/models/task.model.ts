import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Task extends Model<InferAttributes<Task>, InferCreationAttributes<Task>> {
  declare id: number;
  declare projectId: number;
  declare title: string;
  declare descriptionMd?: string | null;
  declare status: "todo" | "in_progress" | "done";
  declare priority: "low" | "medium" | "high";
  declare dueDate?: Date | null;
  declare assignedToId?: number | null;
  declare createdById: number;
}

Task.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    descriptionMd: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM("todo", "in_progress", "done"), allowNull: false, defaultValue: "todo" },
    priority: { type: DataTypes.ENUM("low", "medium", "high"), allowNull: false, defaultValue: "medium" },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    assignedToId: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "tasks", timestamps: true },
);
