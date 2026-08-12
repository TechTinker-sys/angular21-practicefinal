import request from 'supertest';
import { Express } from 'express';
import { createTestApp, resetStores, signupUser, authHeader } from './helpers';

describe('Notes API', () => {
  let app: Express;
  let adminToken: string;
  let viewerToken: string;

  beforeEach(async () => {
    await resetStores();
    app = createTestApp();

    const admin = await signupUser(app, {
      name: 'Admin User',
      email: 'notes-admin@example.com',
      password: 'admin123',
      role: 'admin',
    });
    adminToken = admin.token;

    const viewer = await signupUser(app, {
      name: 'Viewer User',
      email: 'notes-viewer@example.com',
      password: 'viewer123',
      role: 'viewer',
    });
    viewerToken = viewer.token;
  });

  describe('POST /api/notes', () => {
    it('should create a note as admin', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'My note', content: 'Hello world' })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'My note',
        content: 'Hello world',
      });
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');
      expect(res.body.createdAt).toBe(res.body.updatedAt);
    });

    it('should default title to "Untitled note" when title is empty', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ content: 'Just content' })
        .expect(201);

      expect(res.body.title).toBe('Untitled note');
      expect(res.body.content).toBe('Just content');
    });

    it('should trim title and content', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: '  Spaced title  ', content: '  Spaced content  ' })
        .expect(201);

      expect(res.body.title).toBe('Spaced title');
      expect(res.body.content).toBe('Spaced content');
    });

    it('should reject requests without title and content', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({})
        .expect(400);

      expect(res.body.error).toBe('title or content is required');
    });

    it('should deny viewer role', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'No permission', content: 'Should fail' })
        .expect(403);

      expect(res.body.error).toBe('You do not have permission to perform this action');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({ title: 'No auth', content: 'Should fail' })
        .expect(401);

      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('GET /api/notes', () => {
    it('should return an empty list when no notes exist', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set(authHeader(viewerToken))
        .expect(200);

      expect(res.body).toEqual({ notes: [], total: 0 });
    });

    it('should return all notes', async () => {
      await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Note 1', content: 'Content 1' })
        .expect(201);
      await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Note 2', content: 'Content 2' })
        .expect(201);

      const res = await request(app)
        .get('/api/notes')
        .set(authHeader(viewerToken))
        .expect(200);

      expect(res.body.total).toBe(2);
      expect(res.body.notes).toHaveLength(2);
    });

    it('should support pagination with page and limit', async () => {
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/notes')
          .set(authHeader(adminToken))
          .send({ title: `Note ${i}`, content: `Content ${i}` })
          .expect(201);
      }

      const res = await request(app)
        .get('/api/notes?page=2&limit=2')
        .set(authHeader(viewerToken))
        .expect(200);

      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(2);
      expect(res.body.total).toBe(5);
      expect(res.body.notes).toHaveLength(2);
    });

    it('should reject invalid page/limit (non-numeric)', async () => {
      const res = await request(app)
        .get('/api/notes?page=abc&limit=2')
        .set(authHeader(viewerToken))
        .expect(400);

      expect(res.body.error).toBe('page and limit must be numbers');
    });

    it('should reject non-positive page/limit', async () => {
      const res = await request(app)
        .get('/api/notes?page=0&limit=2')
        .set(authHeader(viewerToken))
        .expect(400);

      expect(res.body.error).toBe('page and limit must be positive numbers');
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/notes').expect(401);

      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return a note by id', async () => {
      const created = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Find me', content: 'Found' })
        .expect(201);

      const res = await request(app)
        .get(`/api/notes/${created.body.id}`)
        .set(authHeader(viewerToken))
        .expect(200);

      expect(res.body).toEqual(created.body);
    });

    it('should return 404 for a non-existent note', async () => {
      const res = await request(app)
        .get('/api/notes/nonexistent-id')
        .set(authHeader(viewerToken))
        .expect(404);

      expect(res.body.error).toBe('Note not found');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update a note title', async () => {
      const created = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Old title', content: 'Old content' })
        .expect(201);

      const res = await request(app)
        .put(`/api/notes/${created.body.id}`)
        .set(authHeader(adminToken))
        .send({ title: 'New title' })
        .expect(200);

      expect(res.body.title).toBe('New title');
      expect(res.body.content).toBe('Old content');
      expect(res.body.updatedAt).not.toBe(res.body.createdAt);
    });

    it('should update a note content', async () => {
      const created = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Title', content: 'Old content' })
        .expect(201);

      const res = await request(app)
        .put(`/api/notes/${created.body.id}`)
        .set(authHeader(adminToken))
        .send({ content: 'New content' })
        .expect(200);

      expect(res.body.title).toBe('Title');
      expect(res.body.content).toBe('New content');
    });

    it('should reject update without title and content', async () => {
      const created = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Title', content: 'Content' })
        .expect(201);

      const res = await request(app)
        .put(`/api/notes/${created.body.id}`)
        .set(authHeader(adminToken))
        .send({})
        .expect(400);

      expect(res.body.error).toBe('title or content is required');
    });

    it('should return 404 for a non-existent note', async () => {
      const res = await request(app)
        .put('/api/notes/nonexistent-id')
        .set(authHeader(adminToken))
        .send({ title: 'New title', content: 'New content' })
        .expect(404);

      expect(res.body.error).toBe('Note not found');
    });

    it('should deny viewer role', async () => {
      const created = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Title', content: 'Content' })
        .expect(201);

      const res = await request(app)
        .put(`/api/notes/${created.body.id}`)
        .set(authHeader(viewerToken))
        .send({ title: 'Hacked', content: 'Should fail' })
        .expect(403);

      expect(res.body.error).toBe('You do not have permission to perform this action');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a note as admin', async () => {
      const created = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Delete me', content: 'Gone soon' })
        .expect(201);

      await request(app)
        .delete(`/api/notes/${created.body.id}`)
        .set(authHeader(adminToken))
        .expect(204);

      // Verify it's gone
      const res = await request(app)
        .get(`/api/notes/${created.body.id}`)
        .set(authHeader(viewerToken))
        .expect(404);
      expect(res.body.error).toBe('Note not found');
    });

    it('should return 404 for a non-existent note', async () => {
      const res = await request(app)
        .delete('/api/notes/nonexistent-id')
        .set(authHeader(adminToken))
        .expect(404);

      expect(res.body.error).toBe('Note not found');
    });

    it('should deny viewer role', async () => {
      const created = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Title', content: 'Content' })
        .expect(201);

      const res = await request(app)
        .delete(`/api/notes/${created.body.id}`)
        .set(authHeader(viewerToken))
        .expect(403);

      expect(res.body.error).toBe('You do not have permission to perform this action');
    });
  });
});