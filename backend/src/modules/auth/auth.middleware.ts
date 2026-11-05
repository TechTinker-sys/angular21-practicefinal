import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../common/errors/api-error.js';
import { UserRole } from '../users/user.schema.js';
import { AuthService } from './auth.service.js';

export function createAuthMiddleware(auth: AuthService) {
  const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }
    req.user = await auth.authenticate(token);
    next();
  };

  const authorizeRole = (...roles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }
      if (!roles.includes(req.user.role)) {
        throw new ApiError(403, 'You do not have permission to perform this action');
      }
      next();
    };
  };

  return { authenticate, authorizeRole };
}
