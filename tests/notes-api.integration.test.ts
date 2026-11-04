import express from 'express';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { Sequelize } from 'sequelize';

const repoRoot = process.cwd();
const require = createRequire(import.meta.url);
const originalCwd = process.cwd();
const originalEnv = {
  DB_HOST: process.env['DB_HOST'],
  DB_NAME: process.env['DB_NAME'],
  DB_USER: process.env['DB_USER'],
  DB_PASSWORD: process.env['DB_PASSWORD'],
  JWT_SECRET: process.env['JWT_SECRET'],
};

let container: StartedMySqlContainer | undefined;
let sequelize: Sequelize | undefined;
let tempCwd: string | undefined;
let app: express.Express;

interface Migration {
  up(queryInterface: ReturnType<Sequelize['getQueryInterface']>, sequelizeType: typeof Sequelize): Promise<void>;
}

interface AuthResponse {
  user: { id: string; email: string; role: string };
  token: string;
}

async function signup(
  role: 'admin' | 'viewer' = 'viewer',
  email = `${role}-${crypto.randomUUID()}@example.test`,
): Promise<AuthResponse> {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({ name: `${role} user`, email, password: 'secure-password', role })
    .expect(201);
  return response.body as AuthResponse;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  tempCwd = await mkdtemp(join(tmpdir(), 'notes-api-test-'));
  process.chdir(tempCwd);

  container = await new MySqlContainer('mysql:8.0')
    .withDatabase('notes_api_test')
    .withUsername('test')
    .withUserPassword('test')
    .start();

  process.env['DB_HOST'] = container.getHost();
  process.env['DB_NAME'] = container.getDatabase();
  process.env['DB_USER'] = container.getUsername();
  process.env['DB_PASSWORD'] = container.getUserPassword();
  process.env['JWT_SECRET'] = 'notes-api-integration-test-secret';

  const [{ sequelize: database }, { authRouter, authenticateToken }, { notesRouter }] =
    await Promise.all([
      import('../src/api/database'),
      import('../src/api/auth'),
      import('../src/api/notes'),
    ]);
  sequelize = database;
  const mysqlPort = container.getPort();
  sequelize.addHook('beforeConnect', (config) => {
    config.port = String(mysqlPort);
  });
  await sequelize.authenticate();

  const queryInterface = sequelize.getQueryInterface();
  const migrationsDirectory = resolve(repoRoot, 'src', 'api', 'migrations');
  const migrations = [
    '20261103000000-create-users.js',
    '20261103000001-create-notes.js',
    '20261103000002-create-revoked-tokens.js',
  ];
  for (const migrationName of migrations) {
    const migration = require(join(migrationsDirectory, migrationName)) as Migration;
    await migration.up(queryInterface, Sequelize);
  }

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/notes', authenticateToken, notesRouter);
});

beforeEach(async () => {
  await sequelize?.query('TRUNCATE TABLE revoked_tokens');
  await sequelize?.query('TRUNCATE TABLE notes');
  await sequelize?.query('TRUNCATE TABLE users');
});

afterAll(async () => {
  try {
    await sequelize?.close();
    await container?.stop();
  } finally {
    process.chdir(originalCwd);
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
    if (tempCwd) {
      await rm(tempCwd, { recursive: true, force: true });
    }
  }
});

describe('notes API integration', () => {
  it('signs up users, validates input, and rejects duplicate emails', async () => {
    const user = await signup('viewer', 'signup@example.test');
    expect(user.user.role).toBe('viewer');
    expect(user.token).toEqual(expect.any(String));

    await request(app).post('/api/auth/signup').send({}).expect(400);
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Signup user', email: user.user.email, password: 'secure-password' })
      .expect(409);
  });

  it('logs in and rejects invalid credentials', async () => {
    const user = await signup('admin', 'login@example.test');
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.user.email, password: 'secure-password' })
      .expect(200);
    expect(response.body.user.id).toBe(user.user.id);
    expect(response.body.token).toEqual(expect.any(String));

    await request(app)
      .post('/api/auth/login')
      .send({ email: user.user.email, password: 'wrong-password' })
      .expect(401);
    await request(app).post('/api/auth/login').send({}).expect(400);
  });

  it('rejects missing and malformed tokens and revoked tokens after logout', async () => {
    await request(app).get('/api/notes').expect(401);
    await request(app).get('/api/notes').set('Authorization', 'Bearer invalid').expect(401);

    const user = await signup('admin');
    await request(app).post('/api/auth/logout').set(auth(user.token)).expect(204);
    await request(app).get('/api/notes').set(auth(user.token)).expect(401);
  });

  it('supports note create, read, update, and delete with real persistence', async () => {
    const admin = await signup('admin');
    const authorization = auth(admin.token);
    const created = await request(app)
      .post('/api/notes')
      .set(authorization)
      .send({ title: 'Integration note', content: 'Initial content' })
      .expect(201);
    expect(created.body.title).toBe('Integration note');

    const listed = await request(app).get('/api/notes').set(authorization).expect(200);
    expect(listed.body.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.body.id })]),
    );
    await request(app)
      .get(`/api/notes/${created.body.id}`)
      .set(authorization)
      .expect(200)
      .then((response) => expect(response.body.content).toBe('Initial content'));

    await request(app)
      .put(`/api/notes/${created.body.id}`)
      .set(authorization)
      .send({ title: 'Updated integration note', content: 'Updated content' })
      .expect(200)
      .then((response) => expect(response.body.title).toBe('Updated integration note'));

    await request(app)
      .delete(`/api/notes/${created.body.id}`)
      .set(authorization)
      .expect(204);
    await request(app).get(`/api/notes/${created.body.id}`).set(authorization).expect(404);
  });

  it('allows viewers to read notes and forbids note mutations', async () => {
    const admin = await signup('admin');
    const viewer = await signup('viewer');
    const created = await request(app)
      .post('/api/notes')
      .set(auth(admin.token))
      .send({ title: 'Admin note' })
      .expect(201);

    await request(app).get('/api/notes').set(auth(viewer.token)).expect(200);
    await request(app)
      .post('/api/notes')
      .set(auth(viewer.token))
      .send({ title: 'Viewer note' })
      .expect(403);
    await request(app)
      .put(`/api/notes/${created.body.id}`)
      .set(auth(viewer.token))
      .send({ title: 'Viewer edit' })
      .expect(403);
    await request(app)
      .delete(`/api/notes/${created.body.id}`)
      .set(auth(viewer.token))
      .expect(403);
  });

  it('returns 400 and 404 for invalid note requests and missing notes', async () => {
    const admin = await signup('admin');
    const authorization = auth(admin.token);

    await request(app).post('/api/notes').set(authorization).send({}).expect(400);
    await request(app).get('/api/notes?page=invalid').set(authorization).expect(400);
    await request(app).get('/api/notes?page=0').set(authorization).expect(400);
    await request(app).get('/api/notes/missing').set(authorization).expect(404);
    await request(app)
      .put('/api/notes/missing')
      .set(authorization)
      .send({ title: 'Missing note' })
      .expect(404);
    await request(app).delete('/api/notes/missing').set(authorization).expect(404);
  });
});
