import request from 'supertest';
import { Express } from 'express';
import { createTestApp, resetStores, signupUser, authHeader } from './helpers';

describe('Notifications API', () => {
  let app: Express;
  let adminToken: string;
  let adminId: string;
  let viewerToken: string;
  let viewerId: string;

  beforeEach(async () => {
    await resetStores();
    app = createTestApp();

    const admin = await signupUser(app, {
      name: 'Admin User',
      email: 'notif-admin@example.com',
      password: 'admin123',
      role: 'admin',
    });
    adminToken = admin.token;
    adminId = admin.id;

    const viewer = await signupUser(app, {
      name: 'Viewer User',
      email: 'notif-viewer@example.com',
      password: 'viewer123',
      role: 'viewer',
    });
    viewerToken = viewer.token;
    viewerId = viewer.id;
  });

  describe('POST /api/notes (creates notification to admins)', () => {
    it('should notify all admins when a viewer creates a note', async () => {
      await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'Needs approval', content: 'Please review' })
        .expect(201);

      const res = await request(app)
        .get('/api/notifications')
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.unreadCount).toBe(1);
      expect(res.body.notifications[0]).toMatchObject({
        recipientId: adminId,
        type: 'note_created',
        read: false,
      });
      expect(res.body.notifications[0].message).toContain('Viewer User');
      expect(res.body.notifications[0].message).toContain('Needs approval');
      expect(res.body.notifications[0]).toHaveProperty('noteId');
    });

    it('should NOT notify admins when an admin creates a note', async () => {
      await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Admin note', content: 'Approved immediately' })
        .expect(201);

      const res = await request(app)
        .get('/api/notifications')
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.body.total).toBe(0);
    });

    it('should not show another users notifications to a viewer', async () => {
      await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'Needs approval', content: 'Please review' })
        .expect(201);

      const res = await request(app)
        .get('/api/notifications')
        .set(authHeader(viewerToken))
        .expect(200);

      expect(res.body.total).toBe(0);
    });
  });

  describe('PUT /api/notes/:id/approve (creates notification to author)', () => {
    it('should notify the viewer when an admin approves their note', async () => {
      const created = await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'My pending note', content: 'Approve me' })
        .expect(201);

      await request(app)
        .put(`/api/notes/${created.body.id}/approve`)
        .set(authHeader(adminToken))
        .expect(200);

      const res = await request(app)
        .get('/api/notifications')
        .set(authHeader(viewerToken))
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.unreadCount).toBe(1);
      expect(res.body.notifications[0]).toMatchObject({
        recipientId: viewerId,
        type: 'note_approved',
        read: false,
      });
      expect(res.body.notifications[0].message).toContain('My pending note');
      expect(res.body.notifications[0].message).toContain('Admin User');
      expect(res.body.notifications[0].noteId).toBe(created.body.id);
    });

    it('should NOT notify the admin when approving their own note', async () => {
      const created = await request(app)
        .post('/api/notes')
        .set(authHeader(adminToken))
        .send({ title: 'Admin note', content: 'Already approved' })
        .expect(201);

      await request(app)
        .put(`/api/notes/${created.body.id}/approve`)
        .set(authHeader(adminToken))
        .expect(200);

      const res = await request(app)
        .get('/api/notifications')
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.body.total).toBe(0);
    });
  });

  describe('GET /api/notifications', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/notifications').expect(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should return notifications newest first', async () => {
      // Create two pending notes from the viewer → two admin notifications.
      await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'First note', content: 'First content' })
        .expect(201);

      await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'Second note', content: 'Second content' })
        .expect(201);

      const res = await request(app)
        .get('/api/notifications')
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.body.total).toBe(2);
      expect(res.body.unreadCount).toBe(2);
      expect(res.body.notifications).toHaveLength(2);
      expect(res.body.notifications[0].message).toContain('Second note');
      expect(res.body.notifications[1].message).toContain('First note');
      // Newest first
      expect(res.body.notifications[0].createdAt >= res.body.notifications[1].createdAt).toBe(true);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark a single notification as read', async () => {
      await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'Pending', content: 'Content' })
        .expect(201);

      const list = await request(app)
        .get('/api/notifications')
        .set(authHeader(adminToken))
        .expect(200);

      const notificationId = list.body.notifications[0].id as string;

      const res = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.body.read).toBe(true);

      const after = await request(app)
        .get('/api/notifications')
        .set(authHeader(adminToken))
        .expect(200);

      expect(after.body.unreadCount).toBe(0);
      expect(after.body.notifications[0].read).toBe(true);
    });

    it('should deny another user marking a notification as read', async () => {
      await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'Pending', content: 'Content' })
        .expect(201);

      const list = await request(app)
        .get('/api/notifications')
        .set(authHeader(adminToken))
        .expect(200);

      const notificationId = list.body.notifications[0].id as string;

      const res = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set(authHeader(viewerToken))
        .expect(403);

      expect(res.body.error).toBe('You do not have permission to modify this notification');
    });

    it('should return 404 for a non-existent notification', async () => {
      const res = await request(app)
        .put('/api/notifications/nonexistent-id/read')
        .set(authHeader(adminToken))
        .expect(404);

      expect(res.body.error).toBe('Notification not found');
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read for the current user', async () => {
      await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'First pending', content: 'Content' })
        .expect(201);

      await request(app)
        .post('/api/notes')
        .set(authHeader(viewerToken))
        .send({ title: 'Second pending', content: 'Content' })
        .expect(201);

      const before = await request(app)
        .get('/api/notifications')
        .set(authHeader(adminToken))
        .expect(200);
      expect(before.body.unreadCount).toBe(2);

      await request(app)
        .put('/api/notifications/read-all')
        .set(authHeader(adminToken))
        .expect(204);

      const after = await request(app)
        .get('/api/notifications')
        .set(authHeader(adminToken))
        .expect(200);

      expect(after.body.unreadCount).toBe(0);
      expect(after.body.notifications.every((n: { read: boolean }) => n.read)).toBe(true);
    });
  });
});