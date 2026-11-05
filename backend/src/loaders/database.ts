import { Sequelize } from 'sequelize';
import { environment } from '../config/environment.js';

export const sequelize = new Sequelize(
  environment.DB_NAME,
  environment.DB_USER,
  environment.DB_PASSWORD,
  {
    host: environment.DB_HOST,
    port: environment.DB_PORT,
    dialect: 'mysql',
    logging: false,
  },
);

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
}

export async function closeDatabase(): Promise<void> {
  await sequelize.close();
}
