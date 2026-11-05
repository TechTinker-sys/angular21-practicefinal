import { describe, expect, it, vi } from 'vitest';
import { UserRepository } from './user.repository.js';
import { UserRecord } from './user.schema.js';
import { UserService } from './user.service.js';

describe('UserService', () => {
  it('delegates lookups and strips password hashes from public users', async () => {
    const user: UserRecord = {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Test User',
      email: 'test@example.test',
      passwordHash: 'secret-hash',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    const repository: UserRepository = {
      findByEmail: vi.fn(async () => user),
      findById: vi.fn(async () => user),
      create: vi.fn(async () => user),
    };
    const service = new UserService(repository);

    expect(await service.findByEmail(user.email)).toBe(user);
    expect(await service.findById(user.id)).toBe(user);
    expect(service.toPublicUser(user)).not.toHaveProperty('passwordHash');
  });
});
