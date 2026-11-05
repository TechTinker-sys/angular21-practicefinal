import { NextFunction, Request, Response, Router } from 'express';
import { UserRole } from '../users/user.schema.js';
import { createNoteController } from './note.controller.js';
import { NoteService } from './note.service.js';

type RoleMiddleware = (...roles: UserRole[]) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export function createNoteRouter(
  notes: NoteService,
  authorizeRole: RoleMiddleware,
): Router {
  const router = Router();
  const controller = createNoteController(notes);

  router.post('/', authorizeRole('admin'), controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.put('/:id', authorizeRole('admin'), controller.update);
  router.delete('/:id', authorizeRole('admin'), controller.delete);

  return router;
}
