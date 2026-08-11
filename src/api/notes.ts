import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { authorizeRole } from './auth';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteInput {
  title?: string;
  content?: string;
}

const notesStore = new Map<string, Note>();

const router = Router();

function createNote(input: NoteInput): Note {
  const now = new Date().toISOString();
  const note: Note = {
    id: randomUUID(),
    title: input.title?.trim() || 'Untitled note',
    content: input.content?.trim() || '',
    createdAt: now,
    updatedAt: now,
  };

  notesStore.set(note.id, note);
  return note;
}

function getNoteById(id: string): Note | undefined {
  return notesStore.get(id);
}

function getAllNotes(page?: number, limit?: number) {
  const notes = Array.from(notesStore.values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  if (page !== undefined && limit !== undefined) {
    const start = (page - 1) * limit;
    const pagedNotes = notes.slice(start, start + limit);
    return {
      notes: pagedNotes,
      page,
      limit,
      total: notes.length,
    };
  }

  return {
    notes,
    total: notes.length,
  };
}

function updateNote(id: string, input: NoteInput): Note | undefined {
  const note = getNoteById(id);
  if (!note) {
    return undefined;
  }

  const updatedNote: Note = {
    ...note,
    title: input.title !== undefined ? input.title.trim() : note.title,
    content: input.content !== undefined ? input.content.trim() : note.content,
    updatedAt: new Date().toISOString(),
  };

  notesStore.set(id, updatedNote);
  return updatedNote;
}

function deleteNote(id: string): boolean {
  return notesStore.delete(id);
}

router.post('/', authorizeRole('admin'), (req, res) => {
  const input = req.body as NoteInput;
  if (!input || (!input.title && !input.content)) {
    return res.status(400).json({ error: 'title or content is required' });
  }

  const note = createNote(input);
  return res.status(201).json(note);
});

router.get('/', (req, res) => {
  const page = req.query['page'] ? Number(req.query['page']) : undefined;
  const limit = req.query['limit'] ? Number(req.query['limit']) : undefined;

  if ((page !== undefined && Number.isNaN(page)) || (limit !== undefined && Number.isNaN(limit))) {
    return res.status(400).json({ error: 'page and limit must be numbers' });
  }

  if ((page !== undefined && page < 1) || (limit !== undefined && limit < 1)) {
    return res.status(400).json({ error: 'page and limit must be positive numbers' });
  }

  const result = getAllNotes(page, limit);
  return res.json(result);
});

router.get('/:id', (req, res) => {
  const note = getNoteById(req.params['id'] as string);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  return res.json(note);
});

router.put('/:id', authorizeRole('admin'), (req, res) => {
  const input = req.body as NoteInput;
  if (!input || (input.title === undefined && input.content === undefined)) {
    return res.status(400).json({ error: 'title or content is required' });
  }

  const updated = updateNote(req.params['id'] as string, input);
  if (!updated) {
    return res.status(404).json({ error: 'Note not found' });
  }

  return res.json(updated);
});

router.delete('/:id', authorizeRole('admin'), (req, res) => {
  const deleted = deleteNote(req.params['id'] as string);
  if (!deleted) {
    return res.status(404).json({ error: 'Note not found' });
  }

  return res.status(204).send();
});

export { router as notesRouter, createNote, getNoteById, getAllNotes, updateNote, deleteNote };
