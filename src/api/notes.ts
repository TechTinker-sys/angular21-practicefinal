import { Router } from 'express';
import { authorizeRole } from './auth';
import { Note } from './models/Note';

interface NoteInput {
  title?: string;
  content?: string;
}

const router = Router();

async function createNote(input: NoteInput): Promise<Note> {
  return Note.create({
    title: input.title?.trim() || 'Untitled note',
    content: input.content?.trim() || '',
  });
}

async function getNoteById(id: string): Promise<Note | null> {
  return Note.findByPk(id);
}

async function getAllNotes(page?: number, limit?: number) {
  if (page !== undefined && limit !== undefined) {
    const result = await Note.findAndCountAll({
      order: [['createdAt', 'ASC']],
      offset: (page - 1) * limit,
      limit,
    });
    return {
      notes: result.rows,
      page,
      limit,
      total: result.count,
    };
  }

  const notes = await Note.findAll({ order: [['createdAt', 'ASC']] });
  return {
    notes,
    total: notes.length,
  };
}

async function updateNote(id: string, input: NoteInput): Promise<Note | null> {
  const note = await getNoteById(id);
  if (!note) {
    return null;
  }

  await note.update({
    title: input.title !== undefined ? input.title.trim() : note.title,
    content: input.content !== undefined ? input.content.trim() : note.content,
  });
  return note;
}

async function deleteNote(id: string): Promise<boolean> {
  return (await Note.destroy({ where: { id } })) > 0;
}

router.post('/', authorizeRole('admin'), async (req, res) => {
  const input = req.body as NoteInput;
  if (!input || (!input.title && !input.content)) {
    return res.status(400).json({ error: 'title or content is required' });
  }

  const note = await createNote(input);
  return res.status(201).json(note);
});

router.get('/', async (req, res) => {
  const page = req.query['page'] ? Number(req.query['page']) : undefined;
  const limit = req.query['limit'] ? Number(req.query['limit']) : undefined;

  if ((page !== undefined && Number.isNaN(page)) || (limit !== undefined && Number.isNaN(limit))) {
    return res.status(400).json({ error: 'page and limit must be numbers' });
  }

  if ((page !== undefined && page < 1) || (limit !== undefined && limit < 1)) {
    return res.status(400).json({ error: 'page and limit must be positive numbers' });
  }

  const result = await getAllNotes(page, limit);
  return res.json(result);
});

router.get('/:id', async (req, res) => {
  const note = await getNoteById(req.params['id'] as string);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  return res.json(note);
});

router.put('/:id', authorizeRole('admin'), async (req, res) => {
  const input = req.body as NoteInput;
  if (!input || (input.title === undefined && input.content === undefined)) {
    return res.status(400).json({ error: 'title or content is required' });
  }

  const updated = await updateNote(req.params['id'] as string, input);
  if (!updated) {
    return res.status(404).json({ error: 'Note not found' });
  }

  return res.json(updated);
});

router.delete('/:id', authorizeRole('admin'), async (req, res) => {
  const deleted = await deleteNote(req.params['id'] as string);
  if (!deleted) {
    return res.status(404).json({ error: 'Note not found' });
  }

  return res.status(204).send();
});

export { router as notesRouter };
