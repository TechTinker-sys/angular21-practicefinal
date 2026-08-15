import express, { Express, json } from 'express';
import request from 'supertest';
import { authRouter, usersStore, tokenBlacklist, authenticateToken } from '../src/api/auth';
import { notesRouter, notesStore } from '../src/api/notes';
import { notificationsRouter, notificationsStore } from '../src/api/notifications';

export function createTestApp(): Express {
  const app = express();
  app.use(json());
  app.use('/api/auth', authRouter);
  app.use('/api/notes', authenticateToken, notesRouter);
  app.use('/api/notifications', authenticateToken, notificationsRouter);
  return app;
}

export async function resetStores(): Promise<void> {
  usersStore.clear();
  tokenBlacklist.clear();
  notesStore.clear();
  notificationsStore.clear();
  // The seedUsers() call ran at module load; clearing gives tests a clean slate.
}

export interface TestUser {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'viewer';
}

export async function signupUser(
  app: Express,
  user: TestUser,
): Promise<{ token: string; id: string; role: string }> {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    })
    .expect(201);

  return {
    token: res.body.token as string,
    id: res.body.user.id as string,
    role: res.body.user.role as string,
  };
}

export async function loginUser(
  app: Express,
  email: string,
  password: string,
): Promise<{ token: string }> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return { token: res.body.token as string };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}