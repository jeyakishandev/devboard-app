import { Sequelize } from 'sequelize';

export async function ensureDatabaseExists() {
  const {
    DB_HOST = 'localhost',
    DB_PORT = '5432',
    DB_NAME = 'devboard',
    DB_USER = 'postgres',
    DB_PASS = '',
  } = process.env;

  const admin = new Sequelize('postgres', DB_USER, DB_PASS, {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: 'postgres',
    logging: false,
  });

  try {
    await admin.query(`CREATE DATABASE "${DB_NAME}";`);
    console.log(`[db] database "${DB_NAME}" created`);
  } catch (e: any) {
    // 42P04 => already exists
    if (!(e?.original?.code === '42P04' || /already exists/i.test(String(e?.message)))) {
      console.warn('[db] ensureDatabaseExists warning:', e?.message || e);
    }
  } finally {
    await admin.close();
  }
}

