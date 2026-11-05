import { Request, Response } from 'express';
import { ApiError } from '../../common/errors/api-error.js';
import {
  createNoteSchema,
  paginationSchema,
  updateNoteSchema,
} from './note.schema.js';
import { NoteService } from './note.service.js';

export function createNoteController(notes: NoteService) {
  return {
    create: async (req: Request, res: Response): Promise<void> => {
      const result = createNoteSchema.safeParse(req.body);
      if (!result.success || (!result.data.title && !result.data.content)) {
        throw new ApiError(400, 'title or content is required');
      }
      res.status(201).json(await notes.create(result.data));
    },
    list: async (req: Request, res: Response): Promise<void> => {
      const rawPage = req.query['page'];
      const rawLimit = req.query['limit'];
      const result = paginationSchema.safeParse({
        page: rawPage === undefined ? undefined : Number(rawPage),
        limit: rawLimit === undefined ? undefined : Number(rawLimit),
      });
      if (!result.success) {
        const hasInvalidNumber =
          (rawPage !== undefined && Number.isNaN(Number(rawPage))) ||
          (rawLimit !== undefined && Number.isNaN(Number(rawLimit)));
        throw new ApiError(
          400,
          hasInvalidNumber
            ? 'page and limit must be numbers'
            : 'page and limit must be positive numbers',
        );
      }
      res.json(await notes.list(result.data.page, result.data.limit));
    },
    get: async (req: Request, res: Response): Promise<void> => {
      const note = await notes.findById(String(req.params['id']));
      if (!note) {
        throw new ApiError(404, 'Note not found');
      }
      res.json(note);
    },
    update: async (req: Request, res: Response): Promise<void> => {
      const result = updateNoteSchema.safeParse(req.body);
      if (!result.success) {
        throw new ApiError(400, 'title or content is required');
      }
      res.json(await notes.update(String(req.params['id']), result.data));
    },
    delete: async (req: Request, res: Response): Promise<void> => {
      await notes.delete(String(req.params['id']));
      res.status(204).send();
    },
  };
}
