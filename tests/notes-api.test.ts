import express from 'express';
import request from 'supertest';
import { authRouter, authenticateToken, tokenBlacklist, usersStore } from '../src/api/auth';
import { notesRouter } from '../src/api/notes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/notes', authenticateToken, notesRouter);

let emailSequence = 0;
const createdUserIds: string[] = [];

async function createUser(role: 'admin' | 'viewer') {
  emailSequence += 1;
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      name: `${role} user`,
      email: `${role}-${emailSequence}@example.test`,
      password: 'secure-password',
      role,
    })
    .expect(201);

  createdUserIds.push(response.body.user.id);
  return response.body as { user: { id: string; role: string }; token: string };
}

afterEach(() => {
  tokenBlacklist.clear();
  for (const id of createdUserIds.splice(0)) {
    usersStore.delete(id);
  }
});

describe('authentication', () => {
  it('logs in with the correct password and rejects a wrong password', async () => {
    const user = await createUser('admin');
    const email = `admin-${emailSequence}@example.test`;

    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'secure-password' })
      .expect(200)
      .then((response) => {
        expect(response.body.token).toEqual(expect.any(String));
        expect(response.body.user.id).toBe(user.user.id);
      });

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
      .set('Authorization', 'Bearer not-a-valid-token')
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
