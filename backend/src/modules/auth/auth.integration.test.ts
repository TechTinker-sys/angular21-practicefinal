import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { useMysqlHarness } from '../../test/integration/mysql-harness.js';

const { getApp } = useMysqlHarness();

describe('auth API integration', () => {
  it('signs up, logs in, returns the current user, and logs out', async () => {
    const app = getApp();
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Integration User',
        email: 'integration@example.test',
        password: 'secure-password',
      })
      .expect(201);

    expect(signup.body.user.role).toBe('viewer');
    expect(signup.body.token).toEqual(expect.any(String));

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'integration@example.test', password: 'secure-password' })
      .expect(200);

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200)
      .then((response) =>
        expect(response.body.user.email).toBe('integration@example.test'),
      );

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(204);

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(401);
  });

  it('preserves validation, duplicate, and credential error codes', async () => {
    const app = getApp();
    await request(app).post('/api/auth/signup').send({}).expect(400);

    const input = {
      name: 'Duplicate User',
      email: 'duplicate@example.test',
      password: 'secure-password',
    };
    await request(app).post('/api/auth/signup').send(input).expect(201);
    await request(app).post('/api/auth/signup').send(input).expect(409);

    await request(app)
      .post('/api/auth/login')
      .send({ email: input.email, password: 'wrong-password' })
      .expect(401);
  });
});
