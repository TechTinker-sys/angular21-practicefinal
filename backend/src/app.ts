import express, { Express } from 'express';
import { environment } from './config/environment.js';
import { errorHandler } from './common/middlewares/error-handler.js';
import { loadExpressMiddleware } from './loaders/express.js';
import {
  AuthRepository,
  SequelizeAuthRepository,
} from './modules/auth/auth.repository.js';
import { createAuthMiddleware } from './modules/auth/auth.middleware.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { AuthService } from './modules/auth/auth.service.js';
import { NoteRepository, SequelizeNoteRepository } from './modules/notes/note.repository.js';
import { createNoteRouter } from './modules/notes/note.routes.js';
import { NoteService } from './modules/notes/note.service.js';
import { SequelizeUserRepository, UserRepository } from './modules/users/user.repository.js';
import { createUserRouter } from './modules/users/user.routes.js';
import { UserService } from './modules/users/user.service.js';

export interface ApplicationRepositories {
  users?: UserRepository;
  auth?: AuthRepository;
  notes?: NoteRepository;
}

export function createApp(repositories: ApplicationRepositories = {}): Express {
  const userRepository = repositories.users ?? new SequelizeUserRepository();
  const authRepository = repositories.auth ?? new SequelizeAuthRepository();
  const noteRepository = repositories.notes ?? new SequelizeNoteRepository();
  const userService = new UserService(userRepository);
  const authService = new AuthService(userService, authRepository, environment.JWT_SECRET);
  const noteService = new NoteService(noteRepository);
  const authMiddleware = createAuthMiddleware(authService);
  const app = express();

  loadExpressMiddleware(app);
  app.use('/api/auth', createAuthRouter(authService, authMiddleware, userService));
  app.use(
    '/api/notes',
    authMiddleware.authenticate,
    createNoteRouter(noteService, authMiddleware.authorizeRole),
  );
  app.use(errorHandler);

  return app;
}
