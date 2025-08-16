import { Sequelize } from "sequelize";

const {
  DATABASE_URL,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_NAME,
  NODE_ENV,
} = process.env;

export const sequelize =
  DATABASE_URL
    ? new Sequelize(DATABASE_URL, {
        logging: NODE_ENV === "development" ? console.log : false,
      })
    : new Sequelize(DB_NAME || "devboard", DB_USER || "postgres", DB_PASS || "postgres", {
        host: DB_HOST || "localhost",
        port: DB_PORT ? Number(DB_PORT) : 5432,
        dialect: "postgres",
        logging: NODE_ENV === "development" ? console.log : false,
      });

export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("[db] connected");
  } catch (err) {
    console.error("[db] connection error:", err);
    process.exit(1);
  }
}
