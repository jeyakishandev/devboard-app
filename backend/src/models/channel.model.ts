import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";

export class Channel extends Model<
  InferAttributes<Channel>,
  InferCreationAttributes<Channel>
> {
  declare id: CreationOptional<number>;
  declare projectId: number;
  declare name: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Channel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(50), allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "Channels",
    indexes: [{ unique: true, fields: ["projectId", "name"] }],
  }
);

export default Channel;
