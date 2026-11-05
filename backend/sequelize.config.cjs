const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  development: {
    username: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME'),
    host: requiredEnv('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
  },
  test: {
    username: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME'),
    host: requiredEnv('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
  },
  production: {
    username: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME'),
    host: requiredEnv('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
  },
};
