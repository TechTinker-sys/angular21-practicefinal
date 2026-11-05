import { NoteModel } from './note.model.js';
import { NoteRecord } from './note.schema.js';

export interface NoteRepository {
  create(input: { title: string; content: string }): Promise<NoteRecord>;
  findById(id: string): Promise<NoteRecord | null>;
  findAll(): Promise<NoteRecord[]>;
  findPage(page: number, limit: number): Promise<{ rows: NoteRecord[]; count: number }>;
  update(note: NoteRecord, values: { title: string; content: string }): Promise<NoteRecord>;
  delete(id: string): Promise<boolean>;
}

function toRecord(note: NoteModel): NoteRecord {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export class SequelizeNoteRepository implements NoteRepository {
  async create(input: { title: string; content: string }): Promise<NoteRecord> {
    return toRecord(await NoteModel.create(input));
  }

  async findById(id: string): Promise<NoteRecord | null> {
    const note = await NoteModel.findByPk(id);
    return note ? toRecord(note) : null;
  }

  async findAll(): Promise<NoteRecord[]> {
    const notes = await NoteModel.findAll({ order: [['createdAt', 'ASC']] });
    return notes.map(toRecord);
  }

  async findPage(page: number, limit: number): Promise<{ rows: NoteRecord[]; count: number }> {
    const result = await NoteModel.findAndCountAll({
      order: [['createdAt', 'ASC']],
      offset: (page - 1) * limit,
      limit,
    });
    return { rows: result.rows.map(toRecord), count: result.count };
  }

  async update(
    note: NoteRecord,
    values: { title: string; content: string },
  ): Promise<NoteRecord> {
    const model = await NoteModel.findByPk(note.id);
    if (!model) {
      return note;
    }
    return toRecord(await model.update(values));
  }

  async delete(id: string): Promise<boolean> {
    return (await NoteModel.destroy({ where: { id } })) > 0;
  }
}
