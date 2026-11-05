import { ApiError } from '../../common/errors/api-error.js';
import { NoteRepository } from './note.repository.js';
import { NoteRecord } from './note.schema.js';

export class NoteService {
  constructor(private readonly notes: NoteRepository) {}

  async create(input: { title?: string; content?: string }): Promise<NoteRecord> {
    return this.notes.create({
      title: input.title?.trim() || 'Untitled note',
      content: input.content?.trim() || '',
    });
  }

  findById(id: string): Promise<NoteRecord | null> {
    return this.notes.findById(id);
  }

  async list(page?: number, limit?: number) {
    if (page !== undefined && limit !== undefined) {
      const result = await this.notes.findPage(page, limit);
      return { notes: result.rows, page, limit, total: result.count };
    }
    const notes = await this.notes.findAll();
    return { notes, total: notes.length };
  }

  async update(
    id: string,
    input: { title?: string; content?: string },
  ): Promise<NoteRecord> {
    const note = await this.notes.findById(id);
    if (!note) {
      throw new ApiError(404, 'Note not found');
    }
    return this.notes.update(note, {
      title: input.title === undefined ? note.title : input.title.trim(),
      content: input.content === undefined ? note.content : input.content.trim(),
    });
  }

  async delete(id: string): Promise<void> {
    if (!(await this.notes.delete(id))) {
      throw new ApiError(404, 'Note not found');
    }
  }
}
