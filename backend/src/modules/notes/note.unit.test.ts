import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../common/errors/api-error.js';
import { NoteRepository } from './note.repository.js';
import { NoteRecord } from './note.schema.js';
import { NoteService } from './note.service.js';

function createHarness() {
  const note: NoteRecord = {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Title',
    content: 'Content',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repository: NoteRepository = {
    create: vi.fn(async (input) => ({ ...note, ...input })),
    findById: vi.fn(async (id) => (id === note.id ? note : null)),
    findAll: vi.fn(async () => [note]),
    findPage: vi.fn(async () => ({ rows: [note], count: 1 })),
    update: vi.fn(async (_existing, values) => ({ ...note, ...values })),
    delete: vi.fn(async (id) => id === note.id),
  };
  return { service: new NoteService(repository), repository, note };
}

describe('NoteService', () => {
  it('applies defaults when creating a note', async () => {
    const { service, repository } = createHarness();
    await service.create({});
    expect(repository.create).toHaveBeenCalledWith({
      title: 'Untitled note',
      content: '',
    });
  });

  it('returns paginated and unpaginated note lists', async () => {
    const { service } = createHarness();
    expect(await service.list()).toMatchObject({ total: 1 });
    expect(await service.list(1, 5)).toMatchObject({ page: 1, limit: 5, total: 1 });
  });

  it('returns 404 for missing notes during update and delete', async () => {
    const { service } = createHarness();
    await expect(service.update('missing', { title: 'New' })).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(service.delete('missing')).rejects.toBeInstanceOf(ApiError);
  });
});
