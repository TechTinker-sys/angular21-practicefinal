import { PublicUser } from '../modules/users/user.schema.js';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
