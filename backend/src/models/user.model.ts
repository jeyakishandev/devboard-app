import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: number;
  declare username: string;
  declare email: string;
  declare passwordHash: string;
  declare avatarUrl?: string | null;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, tableName: "users", timestamps: true },
);
