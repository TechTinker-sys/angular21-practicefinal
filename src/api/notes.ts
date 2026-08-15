import { Router, Request } from 'express';
import { randomUUID } from 'node:crypto';
import type { PublicUser } from './auth';
import { notifyAllAdmins, notifyUser } from './notifications';

export interface Note {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NoteInput {
  title?: string;
  content?: string;
}

const notesStore = new Map<string, Note>();

const router = Router();

function getRequestUser(req: Request): PublicUser {
  return (req as Request & { user?: PublicUser }).user as PublicUser;
}

function createNote(input: NoteInput, user: PublicUser): Note {
  const now = new Date().toISOString();
  const note: Note = {
    id: randomUUID(),
    title: input.title?.trim() || 'Untitled note',
    content: input.content?.trim() || '',
    authorId: user.id,
    authorName: user.name,
    // Notes created by an admin are approved immediately; viewer notes require admin approval.
    approved: user.role === 'admin',
    createdAt: now,
    updatedAt: now,
  };

  notesStore.set(note.id, note);

  // Notify all admins when a viewer creates a note that requires approval.
  if (user.role !== 'admin') {
    notifyAllAdmins(
      'note_created',
      `${note.authorName} submitted a new note titled “${note.title}” for approval.`,
      note.id,
    );
  }

  return note;
}

function getNoteById(id: string): Note | undefined {
  return notesStore.get(id);
}

// Admin can read everything. Viewers can read approved notes plus their own (even if pending).
function canRead(note: Note, user: PublicUser): boolean {
  if (user.role === 'admin') {
    return true;
  }
  return note.approved || note.authorId === user.id;
}

// Admin can modify everything. Viewers can only modify notes they authored.
function canModify(note: Note, user: PublicUser): boolean {
  if (user.role === 'admin') {
    return true;
  }
  return note.authorId === user.id;
}

function getAllNotes(user: PublicUser, page?: number, limit?: number) {
  const notes = Array.from(notesStore.values())
    .filter((note) => canRead(note, user))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

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

// Both admin and viewer can create notes (endpoint already requires authentication).
router.post('/', (req, res) => {
  const user = getRequestUser(req);
  const input = req.body as NoteInput;
  if (!input || (!input.title && !input.content)) {
    return res.status(400).json({ error: 'title or content is required' });
  }

  const note = createNote(input, user);
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

  const user = getRequestUser(req);
  const result = getAllNotes(user, page, limit);
  return res.json(result);
});

router.get('/:id', (req, res) => {
  const note = getNoteById(req.params['id'] as string);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const user = getRequestUser(req);
  if (!canRead(note, user)) {
    return res.status(403).json({ error: 'You do not have permission to view this note' });
  }

  return res.json(note);
});

// Admin can update any note; viewers can update only their own notes.
router.put('/:id', (req, res) => {
  const user = getRequestUser(req);
  const note = getNoteById(req.params['id'] as string);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  if (!canModify(note, user)) {
    return res.status(403).json({ error: 'You do not have permission to modify this note' });
  }

  const input = req.body as NoteInput;
  if (!input || (input.title === undefined && input.content === undefined)) {
    return res.status(400).json({ error: 'title or content is required' });
  }

  const updated = updateNote(req.params['id'] as string, input);
  return res.json(updated);
});

// Admin can delete any note; viewers can delete only their own notes.
router.delete('/:id', (req, res) => {
  const user = getRequestUser(req);
  const note = getNoteById(req.params['id'] as string);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  if (!canModify(note, user)) {
    return res.status(403).json({ error: 'You do not have permission to modify this note' });
  }

  const deleted = deleteNote(req.params['id'] as string);
  if (!deleted) {
    return res.status(404).json({ error: 'Note not found' });
  }

  return res.status(204).send();
});

// Admin approves a pending viewer note.
router.put('/:id/approve', (req, res) => {
  const user = getRequestUser(req);
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  }

  const note = getNoteById(req.params['id'] as string);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const approvedNote: Note = {
    ...note,
    approved: true,
    updatedAt: new Date().toISOString(),
  };
  notesStore.set(note.id, approvedNote);

  // Notify the note author when an admin approves their note.
  if (note.authorId !== user.id) {
    notifyUser(
      note.authorId,
      'note_approved',
      `Your note titled “${note.title}” was approved by ${user.name}.`,
      note.id,
    );
  }

  return res.json(approvedNote);
});

export {
  router as notesRouter,
  createNote,
  getNoteById,
  getAllNotes,
  updateNote,
  deleteNote,
  canRead,
  canModify,
  notesStore,
};
