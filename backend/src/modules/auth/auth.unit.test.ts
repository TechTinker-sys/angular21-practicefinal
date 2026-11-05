import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../common/errors/api-error.js';
import { UserRepository } from '../users/user.repository.js';
import { UserRecord } from '../users/user.schema.js';
import { UserService } from '../users/user.service.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

function createHarness() {
  const users = new Map<string, UserRecord>();
  const userRepository: UserRepository = {
    findByEmail: vi.fn(async (email) =>
      Array.from(users.values()).find((user) => user.email === email) ?? null,
    ),
    findById: vi.fn(async (id) => users.get(id) ?? null),
    create: vi.fn(async (input) => {
      const user: UserRecord = {
        id: randomUUID(),
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        createdAt: new Date().toISOString(),
      };
      users.set(user.id, user);
      return user;
    }),
  };
  const revoked = new Set<string>();
  const authRepository: AuthRepository = {
    isTokenRevoked: vi.fn(async (hash) => revoked.has(hash)),
    revokeToken: vi.fn(async (hash) => {
      revoked.add(hash);
    }),
  };
  const service = new AuthService(
    new UserService(userRepository),
    authRepository,
    'unit-test-secret-that-is-long-enough',
  );
  return { service, users, authRepository };
}

describe('AuthService', () => {
  it('creates viewer accounts by default and authenticates a signed token', async () => {
    const { service } = createHarness();
    const session = await service.signup({
      name: 'Test User',
      email: 'TEST@example.test',
      password: 'secure-password',
      role: 'unsupported',
    });

    expect(session.user.email).toBe('test@example.test');
    expect(session.user.role).toBe('viewer');
    expect(session.user).not.toHaveProperty('passwordHash');
    expect(await service.authenticate(session.token)).toMatchObject({
      id: session.user.id,
      role: 'viewer',
    });
  });

  it('returns 400 for invalid signup and login input', async () => {
    const { service } = createHarness();
    await expect(service.signup({})).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.login({})).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns 409 for duplicate signup and 401 for invalid credentials', async () => {
    const { service } = createHarness();
    const signup = {
      name: 'Test User',
      email: 'duplicate@example.test',
      password: 'secure-password',
    };
    await service.signup(signup);
    await expect(service.signup(signup)).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      service.login({ email: signup.email, password: 'incorrect-password' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('revokes a token on logout', async () => {
    const { service, authRepository } = createHarness();
    const session = await service.signup({
      name: 'Test User',
      email: 'logout@example.test',
      password: 'secure-password',
    });
    await service.logout(session.token);
    await expect(service.authenticate(session.token)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(authRepository.revokeToken).toHaveBeenCalledOnce();
  });

  it('uses the 401 status for missing accounts and invalid tokens', async () => {
    const { service } = createHarness();
    await expect(
      service.login({ email: 'missing@example.test', password: 'secure-password' }),
    ).rejects.toMatchObject({ statusCode: 401 });
    await expect(service.authenticate('not-a-token')).rejects.toBeInstanceOf(ApiError);
  });
});
