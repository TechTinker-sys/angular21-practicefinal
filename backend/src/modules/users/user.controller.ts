import { Request, Response } from 'express';
import { ApiError } from '../../common/errors/api-error.js';
import { UserService } from './user.service.js';

export function createUserController(users: UserService) {
  return {
    current: (req: Request, res: Response): void => {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }
      res.json({ user: users.toPublicUser(req.user) });
    },
  };
}
