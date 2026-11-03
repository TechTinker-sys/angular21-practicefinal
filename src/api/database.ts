import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { Sequelize } from 'sequelize';

dotenv.config({ path: resolve(process.cwd(), '.env'), override: true });

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in .env`);
  }
  return value;
}

export const sequelize = new Sequelize(
  requiredEnv('DB_NAME'),
  requiredEnv('DB_USER'),
  requiredEnv('DB_PASSWORD'),
  {
    host: requiredEnv('DB_HOST'),
    dialect: 'mysql',
    logging: false,
  },
);
