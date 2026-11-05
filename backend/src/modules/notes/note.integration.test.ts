import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { useMysqlHarness } from '../../test/integration/mysql-harness.js';

const { getApp } = useMysqlHarness();

async function createAdminToken(app: Parameters<typeof request>[0]): Promise<string> {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Notes Admin',
      email: 'notes-admin@example.test',
      password: 'secure-password',
      role: 'admin',
    })
    .expect(201);
  return response.body.token as string;
}

describe('notes API integration', () => {
  it('supports persisted note create, list, get, update, and delete', async () => {
    const app = getApp();
    const token = await createAdminToken(app);
    const authorization = `Bearer ${token}`;

    const created = await request(app)
      .post('/api/notes')
      .set('Authorization', authorization)
      .send({ title: 'Integration note', content: 'Initial content' })
      .expect(201);

    const listed = await request(app)
      .get('/api/notes')
      .set('Authorization', authorization)
      .expect(200);
    expect(listed.body.notes).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.body.id })]),
    );

    await request(app)
      .get(`/api/notes/${created.body.id}`)
      .set('Authorization', authorization)
      .expect(200)
      .then((response) => expect(response.body.content).toBe('Initial content'));

    await request(app)
      .put(`/api/notes/${created.body.id}`)
      .set('Authorization', authorization)
      .send({ title: 'Updated note' })
      .expect(200)
      .then((response) => expect(response.body.title).toBe('Updated note'));

    await request(app)
      .delete(`/api/notes/${created.body.id}`)
      .set('Authorization', authorization)
      .expect(204);
    await request(app)
      .get(`/api/notes/${created.body.id}`)
      .set('Authorization', authorization)
      .expect(404);
  });

  it('allows viewers to read and rejects mutations with 403', async () => {
    const app = getApp();
    const adminToken = await createAdminToken(app);
    const viewer = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Notes Viewer',
        email: 'notes-viewer@example.test',
        password: 'secure-password',
      })
      .expect(201);
    const created = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin note' })
      .expect(201);

    await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${viewer.body.token}`)
      .expect(200);
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${viewer.body.token}`)
      .send({ title: 'Forbidden note' })
      .expect(403);
    await request(app)
      .put(`/api/notes/${created.body.id}`)
      .set('Authorization', `Bearer ${viewer.body.token}`)
      .send({ title: 'Forbidden update' })
      .expect(403);
    await request(app)
      .delete(`/api/notes/${created.body.id}`)
      .set('Authorization', `Bearer ${viewer.body.token}`)
      .expect(403);
  });

  it('preserves note validation, pagination, missing-note, and authentication codes', async () => {
    const app = getApp();
    const token = await createAdminToken(app);
    const authorization = `Bearer ${token}`;

    await request(app).get('/api/notes').expect(401);
    await request(app)
      .post('/api/notes')
      .set('Authorization', authorization)
      .send({})
      .expect(400);
    await request(app)
      .get('/api/notes?page=invalid')
      .set('Authorization', authorization)
      .expect(400);
    await request(app)
      .get('/api/notes?page=0')
      .set('Authorization', authorization)
      .expect(400);
    await request(app)
      .get('/api/notes/missing')
      .set('Authorization', authorization)
      .expect(404);
  });
});
