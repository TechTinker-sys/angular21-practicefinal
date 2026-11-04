import express from 'express';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authRouter, authenticateToken, authorizeRole, signToken } from '../src/api/auth';
import { Note } from '../src/api/models/Note';
import { RevokedToken } from '../src/api/models/RevokedToken';
import { User } from '../src/api/models/User';
import { notesRouter } from '../src/api/notes';

vi.mock('../src/api/models/User', () => ({
  User: {
    create: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('../src/api/models/Note', () => ({
  Note: {
    create: vi.fn(),
    destroy: vi.fn(),
    findAll: vi.fn(),
    findAndCountAll: vi.fn(),
    findByPk: vi.fn(),
  },
}));

vi.mock('../src/api/models/RevokedToken', () => ({
  RevokedToken: {
    findByPk: vi.fn(),
    findOrCreate: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/notes', authenticateToken, notesRouter);

const users = new Map<string, User>();
const notes = new Map<string, Note>();

function makeUser(name: string, email: string, role: 'admin' | 'viewer'): User {
  const now = new Date();
  return {
    id: randomUUID(),
    name,
    email,
    passwordHash: bcrypt.hashSync('secure-password', 10),
    role,
    createdAt: now,
    updatedAt: now,
  } as User;
}

function makeNote(title: string, content: string): Note {
  const now = new Date();
  const note = {
    id: randomUUID(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
  return Object.assign(note, {
    update: vi.fn(async (values: { title?: string; content?: string }) => {
      if (values.title !== undefined) {
        note.title = values.title;
      }
      if (values.content !== undefined) {
        note.content = values.content;
      }
      note.updatedAt = new Date();
      return note;
    }),
  }) as unknown as Note;
}

beforeEach(() => {
  users.clear();
  notes.clear();
  vi.clearAllMocks();

  vi.mocked(User.findOne).mockResolvedValue(null);
  vi.mocked(User.findByPk).mockImplementation(async (id) => users.get(String(id)) ?? null);
  vi.mocked(User.create).mockImplementation(async (input) => {
    if (!input) {
      throw new Error('User creation input is required');
    }
    const user = makeUser(input.name, input.email, input.role);
    user.passwordHash = input.passwordHash;
    users.set(user.id, user);
    return user;
  });

  vi.mocked(RevokedToken.findByPk).mockResolvedValue(null);
  vi.mocked(RevokedToken.findOrCreate).mockResolvedValue([{} as RevokedToken, true]);

  vi.mocked(Note.create).mockImplementation(async (input) => {
    if (!input) {
      throw new Error('Note creation input is required');
    }
    const note = makeNote(input.title, input.content);
    notes.set(note.id, note);
    return note;
  });
  vi.mocked(Note.findByPk).mockImplementation(async (id) => notes.get(String(id)) ?? null);
  vi.mocked(Note.findAll).mockImplementation(async () =>
    Array.from(notes.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  );
  vi.mocked(Note.findAndCountAll).mockImplementation(async (options) => {
    const allNotes = Array.from(notes.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    return {
      rows: allNotes.slice(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 0)),
      count: allNotes.length,
    } as never;
  });
  vi.mocked(Note.destroy).mockImplementation(async (options) => {
    if (!options) {
      throw new Error('Note deletion options are required');
    }
    const id = String((options.where as { id?: string }).id);
    return notes.delete(id) ? 1 : 0;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function createUser(role: 'admin' | 'viewer' = 'viewer') {
  const email = `${role}-${randomUUID()}@example.test`;
  const response = await request(app)
    .post('/api/auth/signup')
    .send({ name: `${role} user`, email, password: 'secure-password', role })
    .expect(201);
  return response.body as { user: { id: string; role: string }; token: string };
}

describe('authentication routes', () => {
  it('signs up users and defaults unsupported roles to viewer', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'New user', email: 'new@example.test', password: 'secure-password', role: 'owner' })
      .expect(201);

    expect(response.body.user.role).toBe('viewer');
    expect(response.body.token).toEqual(expect.any(String));
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.test', role: 'viewer' }),
    );
  });

  it('rejects invalid signup fields and duplicate emails', async () => {
    await request(app).post('/api/auth/signup').send({}).expect(400);
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'A', email: 'valid@example.test', password: 'secure-password' })
      .expect(400);
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Valid Name', email: 'bad-email', password: 'secure-password' })
      .expect(400);
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Valid Name', email: 'valid@example.test', password: 'short' })
      .expect(400);

    const existingUser = makeUser('Existing user', 'existing@example.test', 'viewer');
    vi.mocked(User.findOne).mockResolvedValueOnce(existingUser);
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Existing user', email: existingUser.email, password: 'secure-password' })
      .expect(409);
  });

  it('logs in with valid credentials and rejects invalid credentials or input', async () => {
    await request(app).post('/api/auth/login').send({}).expect(400);

    const user = makeUser('Login user', 'login@example.test', 'admin');
    vi.mocked(User.findOne).mockResolvedValueOnce(user);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'secure-password' })
      .expect(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.token).toEqual(expect.any(String));

    vi.mocked(User.findOne).mockResolvedValueOnce(null);
    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'secure-password' })
      .expect(401);

    vi.mocked(User.findOne).mockResolvedValueOnce(user);
    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'incorrect-password' })
      .expect(401);
  });

  it('rejects absent, invalid, revoked, and orphaned user tokens', async () => {
    await request(app).get('/api/notes').expect(401);
    await request(app).get('/api/notes').set('Authorization', 'Bearer invalid').expect(401);

    const user = makeUser('Token user', 'token@example.test', 'admin');
    users.set(user.id, user);
    const token = signToken(user);

    vi.mocked(RevokedToken.findByPk).mockResolvedValueOnce({} as RevokedToken);
    await request(app).get('/api/notes').set('Authorization', `Bearer ${token}`).expect(401);

    users.delete(user.id);
    await request(app).get('/api/notes').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('revokes an authenticated user token on logout', async () => {
    const user = await createUser('admin');
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(204);
    expect(RevokedToken.findOrCreate).toHaveBeenCalledOnce();
  });

  it('returns the authenticated user from the current-user endpoint', async () => {
    const user = await createUser();
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    expect(response.body.user.id).toBe(user.user.id);
  });
});

describe('role authorization', () => {
  it('allows admins and denies viewers on protected routes', async () => {
    const admin = await createUser('admin');
    const viewer = await createUser('viewer');

    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Admin note' })
      .expect(201);
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${viewer.token}`)
      .send({ title: 'Viewer note' })
      .expect(403);
    await request(app)
      .put('/api/notes/missing')
      .set('Authorization', `Bearer ${viewer.token}`)
      .send({ title: 'Viewer edit' })
      .expect(403);
    await request(app)
      .delete('/api/notes/missing')
      .set('Authorization', `Bearer ${viewer.token}`)
      .expect(403);
  });

  it('rejects role checks when no authenticated user is attached', async () => {
    const roleApp = express();
    roleApp.use(authorizeRole('admin'));
    await request(roleApp).get('/').expect(401);
  });
});

describe('notes routes', () => {
  it('creates, lists, reads, updates, and deletes notes', async () => {
    const admin = await createUser('admin');
    const authorization = `Bearer ${admin.token}`;
    const created = await request(app)
      .post('/api/notes')
      .set('Authorization', authorization)
      .send({ title: 'First note', content: 'Initial content' })
      .expect(201);
    const noteId = created.body.id as string;

    const list = await request(app).get('/api/notes').set('Authorization', authorization).expect(200);
    expect(list.body.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: noteId })]),
    );

    await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', authorization)
      .expect(200)
      .then((response) => expect(response.body.content).toBe('Initial content'));

    await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', authorization)
      .send({ title: 'Updated note', content: 'Updated content' })
      .expect(200)
      .then((response) => expect(response.body.title).toBe('Updated note'));

    await request(app).delete(`/api/notes/${noteId}`).set('Authorization', authorization).expect(204);
    await request(app).get(`/api/notes/${noteId}`).set('Authorization', authorization).expect(404);
  });

  it('validates create, update, and pagination inputs', async () => {
    const admin = await createUser('admin');
    const authorization = `Bearer ${admin.token}`;

    await request(app).post('/api/notes').set('Authorization', authorization).send({}).expect(400);
    await request(app)
      .put('/api/notes/missing')
      .set('Authorization', authorization)
      .send({})
      .expect(400);
    await request(app).get('/api/notes?page=nope').set('Authorization', authorization).expect(400);
    await request(app).get('/api/notes?page=0').set('Authorization', authorization).expect(400);

    await request(app)
      .put('/api/notes/missing')
      .set('Authorization', authorization)
      .send({ title: 'Missing note' })
      .expect(404);
    await request(app)
      .delete('/api/notes/missing')
      .set('Authorization', authorization)
      .expect(404);
  });
});
