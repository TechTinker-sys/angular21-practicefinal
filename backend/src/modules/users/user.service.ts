import { UserRepository } from './user.repository.js';
import {
  CreateUserInput,
  createUserSchema,
  PublicUser,
  UserRecord,
} from './user.schema.js';
import { ApiError } from '../../common/errors/api-error.js';

export class UserService {
  constructor(private readonly users: UserRepository) {}

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.users.findByEmail(email);
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.users.findById(id);
  }

  create(input: CreateUserInput): Promise<UserRecord> {
    const result = createUserSchema.safeParse(input);
    if (!result.success) {
      throw new ApiError(400, result.error.issues[0]?.message ?? 'Invalid user input');
    }
    return this.users.create(result.data);
  }

  toPublicUser(user: UserRecord | PublicUser): PublicUser {
    if ('passwordHash' in user) {
      const { passwordHash: _passwordHash, ...publicUser } = user;
      return publicUser;
    }
    return user;
  }
}
