import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Message extends Model<InferAttributes<Message>, InferCreationAttributes<Message>> {
  declare id: number;
  declare projectId: number;
  declare userId: number;
  declare body: string;
}

Message.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: "messages", timestamps: true },
);
