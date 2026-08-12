import request from 'supertest';
import { Express } from 'express';
import { createTestApp, resetStores, signupUser, loginUser, authHeader } from './helpers';

describe('Auth API', () => {
  let app: Express;

  beforeEach(async () => {
    await resetStores();
    app = createTestApp();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'viewer',
      });
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('createdAt');
    });

    it('should default role to viewer when no role is provided', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Viewer User',
          email: 'viewer2@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body.user.role).toBe('viewer');
    });

    it('should allow explicit admin role', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Admin User',
          email: 'admin2@example.com',
          password: 'password123',
          role: 'admin',
        })
        .expect(201);

      expect(res.body.user.role).toBe('admin');
    });

    it('should reject invalid role values and default to viewer', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Weird Role',
          email: 'weird@example.com',
          password: 'password123',
          role: 'superuser',
        })
        .expect(201);

      expect(res.body.user.role).toBe('viewer');
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'No Email' })
        .expect(400);

      expect(res.body.error).toBe('name, email, and password are required');
    });

    it('should reject name shorter than 2 characters', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'A',
          email: 'a@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(res.body.error).toBe('name must be at least 2 characters');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Bad Email',
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);

      expect(res.body.error).toBe('email must be a valid email address');
    });

    it('should reject password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Short Pass',
          email: 'short@example.com',
          password: '123',
        })
        .expect(400);

      expect(res.body.error).toBe('password must be at least 6 characters');
    });

    it('should reject duplicate email (case-insensitive)', async () => {
      await signupUser(app, {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Second User',
          email: 'DUPLICATE@example.com',
          password: 'password123',
        })
        .expect(409);

      expect(res.body.error).toBe('An account with this email already exists');
    });

    it('should trim name and lowercase email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: '  Trimmed User  ',
          email: '  TRIM@Example.com  ',
          password: 'password123',
        })
        .expect(201);

      expect(res.body.user.name).toBe('Trimmed User');
      expect(res.body.user.email).toBe('trim@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await signupUser(app, {
        name: 'Login User',
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('should log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should reject missing email or password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com' })
        .expect(400);

      expect(res.body.error).toBe('email and password are required');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrongpassword' })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should reject unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should be case-insensitive for email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'LOGIN@example.com', password: 'password123' })
        .expect(200);

      expect(res.body.user.email).toBe('login@example.com');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return the current user with a valid token', async () => {
      const { token } = await signupUser(app, {
        name: 'Me User',
        email: 'me@example.com',
        password: 'password123',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeader(token))
        .expect(200);

      expect(res.body.user.email).toBe('me@example.com');
      expect(res.body.user.name).toBe('Me User');
    });

    it('should reject requests without a token', async () => {
      const res = await request(app).get('/api/auth/me').expect(401);

      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject invalid tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeader('invalid-token'))
        .expect(401);

      expect(res.body.error).toBe('Invalid or expired token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should revoke the token', async () => {
      const { token } = await signupUser(app, {
        name: 'Logout User',
        email: 'logout@example.com',
        password: 'password123',
      });

      await request(app).post('/api/auth/logout').set(authHeader(token)).expect(204);

      // Token should now be rejected
      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeader(token))
        .expect(401);

      expect(res.body.error).toBe('Token has been revoked');
    });

    it('should reject logout without a token', async () => {
      const res = await request(app).post('/api/auth/logout').expect(401);

      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('authorizeRole middleware', () => {
    it('should allow admin to access admin-only routes', async () => {
      const { token } = await signupUser(app, {
        name: 'Admin Role',
        email: 'admin-role@example.com',
        password: 'password123',
        role: 'admin',
      });

      const res = await request(app)
        .post('/api/notes')
        .set(authHeader(token))
        .send({ title: 'Admin note', content: 'Created by admin' })
        .expect(201);

      expect(res.body.title).toBe('Admin note');
    });

    it('should deny viewer access to admin-only routes', async () => {
      const { token } = await signupUser(app, {
        name: 'Viewer Role',
        email: 'viewer-role@example.com',
        password: 'password123',
        role: 'viewer',
      });

      const res = await request(app)
        .post('/api/notes')
        .set(authHeader(token))
        .send({ title: 'Viewer note', content: 'Should fail' })
        .expect(403);

      expect(res.body.error).toBe('You do not have permission to perform this action');
    });

    it('should return 401 when no user is attached', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({ title: 'No auth', content: 'Should fail' })
        .expect(401);

      expect(res.body.error).toBe('Authentication required');
    });
  });
});