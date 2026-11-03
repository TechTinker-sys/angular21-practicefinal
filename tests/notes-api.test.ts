import express from 'express';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { authRouter, authenticateToken } from '../src/api/auth';
import { Note } from '../src/api/models/Note';
import { RevokedToken } from '../src/api/models/RevokedToken';
import { User } from '../src/api/models/User';
import { notesRouter } from '../src/api/notes';

jest.mock('../src/api/models/User', () => ({
  User: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../src/api/models/Note', () => ({
  Note: {
    create: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
  },
}));

jest.mock('../src/api/models/RevokedToken', () => ({
  RevokedToken: {
    findByPk: jest.fn(),
    findOrCreate: jest.fn(),
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
    update: jest.fn(async (values: { title?: string; content?: string }) => {
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
  jest.clearAllMocks();

  jest.mocked(User.findOne).mockResolvedValue(null);
  jest.mocked(User.findByPk).mockImplementation(async (id) => users.get(String(id)) ?? null);
  jest.mocked(User.create).mockImplementation(async (input) => {
    const user = makeUser(input.name, input.email, input.role);
    user.passwordHash = input.passwordHash;
    users.set(user.id, user);
    return user;
  });

  jest.mocked(RevokedToken.findByPk).mockResolvedValue(null);
  jest.mocked(RevokedToken.findOrCreate).mockResolvedValue([{} as never, true]);

  jest.mocked(Note.create).mockImplementation(async (input) => {
    const note = makeNote(input.title, input.content);
    notes.set(note.id, note);
    return note;
  });
  jest.mocked(Note.findByPk).mockImplementation(async (id) => notes.get(String(id)) ?? null);
  jest.mocked(Note.findAll).mockImplementation(async () =>
    Array.from(notes.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  );
  jest.mocked(Note.findAndCountAll).mockImplementation(async (options) => {
    const allNotes = Array.from(notes.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    return {
      rows: allNotes.slice(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 0)),
      count: allNotes.length,
    } as never;
  });
  jest.mocked(Note.destroy).mockImplementation(async (options) => {
    const id = String((options.where as { id?: string }).id);
    return notes.delete(id) ? 1 : 0;
  });
});

async function createUser(role: 'admin' | 'viewer') {
  const email = `${role}-${randomUUID()}@example.test`;
  const user = makeUser(`${role} user`, email, role);
  jest.mocked(User.findOne).mockResolvedValueOnce(null);
  jest.mocked(User.create).mockResolvedValueOnce(user);

  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      name: user.name,
      email,
      password: 'secure-password',
      role,
    })
    .expect(201);

  users.set(user.id, user);
  return response.body as { user: { id: string; role: string }; token: string };
}

describe('authentication', () => {
  it('logs in with the correct password and rejects a wrong password', async () => {
    const user = await createUser('admin');
    const storedUser = users.get(user.user.id)!;
    const email = storedUser.email;

    jest.mocked(User.findOne).mockResolvedValueOnce(storedUser);
    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'secure-password' })
      .expect(200)
      .then((response) => {
        expect(response.body.token).toEqual(expect.any(String));
        expect(response.body.user.id).toBe(user.user.id);
      });

    jest.mocked(User.findOne).mockResolvedValueOnce(storedUser);
    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'incorrect-password' })
      .expect(401);
  });
});

describe('notes', () => {
  it('creates, reads, updates, and deletes a note', async () => {
    const admin = await createUser('admin');
    const authorization = `Bearer ${admin.token}`;
    const created = await request(app)
      .post('/api/notes')
      .set('Authorization', authorization)
      .send({ title: 'First note', content: 'Initial content' })
      .expect(201);

    const noteId = created.body.id as string;
    expect(created.body.title).toBe('First note');

    await request(app)
      .get('/api/notes')
      .set('Authorization', authorization)
      .expect(200)
      .then((response) => {
        expect(response.body.notes).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: noteId })]),
        );
      });

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

    await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', authorization)
      .expect(204);

    await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', authorization)
      .expect(404);
  });

  it('allows admins to create notes and denies viewers', async () => {
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
  });
});

describe('request errors', () => {
  it('rejects missing and invalid tokens', async () => {
    await request(app).get('/api/notes').expect(401);

    await request(app)
      .get('/api/notes')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('rejects empty login and note fields', async () => {
    await request(app).post('/api/auth/login').send({}).expect(400);

    const admin = await createUser('admin');
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({})
      .expect(400);
  });
});
