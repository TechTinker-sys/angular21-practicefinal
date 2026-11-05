import { Router } from 'express';
import { UserService } from '../users/user.service.js';
import { createUserRouter } from '../users/user.routes.js';
import { createAuthController } from './auth.controller.js';
import { createAuthMiddleware } from './auth.middleware.js';
import { AuthService } from './auth.service.js';

export function createAuthRouter(
  auth: AuthService,
  middleware: ReturnType<typeof createAuthMiddleware>,
  users: UserService,
): Router {
  const router = Router();
  const controller = createAuthController(auth);

  router.post('/signup', controller.signup);
  router.post('/login', controller.login);
  router.post('/logout', middleware.authenticate, controller.logout);
  router.use(createUserRouter(users, middleware.authenticate));

  return router;
}
