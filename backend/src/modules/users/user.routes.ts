import { NextFunction, Request, Response, Router } from 'express';
import { UserService } from './user.service.js';
import { createUserController } from './user.controller.js';

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export function createUserRouter(users: UserService, authenticate: AuthMiddleware): Router {
  const router = Router();
  const controller = createUserController(users);

  router.get('/me', authenticate, controller.current);

  return router;
}
