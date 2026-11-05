import { Request, Response } from 'express';
import { ApiError } from '../../common/errors/api-error.js';
import { AuthService } from './auth.service.js';

export function createAuthController(auth: AuthService) {
  return {
    signup: async (req: Request, res: Response): Promise<void> => {
      res.status(201).json(await auth.signup(req.body));
    },
    login: async (req: Request, res: Response): Promise<void> => {
      res.json(await auth.login(req.body));
    },
    logout: async (req: Request, res: Response): Promise<void> => {
      const authorization = req.headers.authorization;
      const token = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : undefined;
      if (!token) {
        throw new ApiError(401, 'Authentication required');
      }
      await auth.logout(token);
      res.status(204).send();
    },
  };
}
