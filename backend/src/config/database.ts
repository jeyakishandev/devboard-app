import 'dotenv/config';
import { Sequelize } from 'sequelize';

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'devboard',
  DB_USER = 'postgres',
  DB_PASS = '',
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: console.log,
});
