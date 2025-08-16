import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/database";

export class Message extends Model<
  InferAttributes<Message>,
  InferCreationAttributes<Message>
> {
  declare id: CreationOptional<number>;
  declare projectId: number;
  declare userId: number;

  // champ texte du message
  declare body: string | null;       // <- autoriser null
  declare content: string | null;    // si tu as les deux, garde-les en optionnels

  // pièces jointes
  declare attachmentUrl: string | null;
  declare attachmentMime: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Message.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },

    // ✅ autoriser null pour un message “vide” avec PJ
    body: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },

    // (si tu as aussi `content`, garde-le optionnel)
    content: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },

    attachmentUrl: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    attachmentMime: { type: DataTypes.STRING, allowNull: true, defaultValue: null },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "Messages" }
);
