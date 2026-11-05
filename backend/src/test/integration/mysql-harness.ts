import { afterAll, beforeAll, beforeEach } from 'vitest';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { Sequelize } from 'sequelize';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import express from 'express';

interface Migration {
  up(
    queryInterface: ReturnType<Sequelize['getQueryInterface']>,
    sequelizeType: typeof Sequelize,
  ): Promise<void>;
}

interface IntegrationApp {
  app: express.Express;
  sequelize: Sequelize;
}

export function useMysqlHarness(): { getApp(): express.Express } {
  const originalEnv = {
    DB_HOST: process.env['DB_HOST'],
    DB_PORT: process.env['DB_PORT'],
    DB_NAME: process.env['DB_NAME'],
    DB_USER: process.env['DB_USER'],
    DB_PASSWORD: process.env['DB_PASSWORD'],
    JWT_SECRET: process.env['JWT_SECRET'],
    CORS_ORIGINS: process.env['CORS_ORIGINS'],
  };
  const require = createRequire(resolve(process.cwd(), 'package.json'));
  let container: StartedMySqlContainer | undefined;
  let integrationApp: IntegrationApp | undefined;

  beforeAll(async () => {
    container = await new MySqlContainer('mysql:8.0')
      .withDatabase('notes_api_test')
      .withUsername('test')
      .withUserPassword('test')
      .start();

    process.env['DB_HOST'] = container.getHost();
    process.env['DB_PORT'] = String(container.getPort());
    process.env['DB_NAME'] = container.getDatabase();
    process.env['DB_USER'] = container.getUsername();
    process.env['DB_PASSWORD'] = container.getUserPassword();
    process.env['JWT_SECRET'] = 'integration-test-secret-long-enough';
    process.env['CORS_ORIGINS'] = 'http://localhost:4000,http://localhost:4200';

    const { sequelize } = await import('../../loaders/database.js');
    await sequelize.authenticate();

    const queryInterface = sequelize.getQueryInterface();
    const migrationsDirectory = resolve(
      process.cwd(),
      'src',
      'loaders',
      'database',
      'migrations',
    );
    const migrationNames = [
      '20261103000000-create-users.js',
      '20261103000001-create-notes.js',
      '20261103000002-create-revoked-tokens.js',
    ];

    for (const migrationName of migrationNames) {
      const migration = require(join(migrationsDirectory, migrationName)) as Migration;
      await migration.up(queryInterface, Sequelize);
    }

    const seedersDirectory = resolve(
      process.cwd(),
      'src',
      'loaders',
      'database',
      'seeders',
    );
    const seedAdmin = require(
      join(seedersDirectory, '20261103000000-seed-admin.js'),
    ) as Migration;
    await seedAdmin.up(queryInterface, Sequelize);

    const { createApp } = await import('../../app.js');
    integrationApp = { app: createApp(), sequelize };
  }, 180_000);

  beforeEach(async () => {
    await integrationApp?.sequelize.query('TRUNCATE TABLE revoked_tokens');
    await integrationApp?.sequelize.query('TRUNCATE TABLE notes');
    await integrationApp?.sequelize.query('TRUNCATE TABLE users');
  });

  afterAll(async () => {
    try {
      await integrationApp?.sequelize.close();
      await container?.stop();
    } finally {
      for (const [name, value] of Object.entries(originalEnv)) {
        if (value === undefined) {
          delete process.env[name];
        } else {
          process.env[name] = value;
        }
      }
    }
  });

  return {
    getApp() {
      if (!integrationApp) {
        throw new Error('Integration app has not been initialized');
      }
      return integrationApp.app;
    },
  };
}
