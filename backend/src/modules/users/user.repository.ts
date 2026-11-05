import { col, fn, where } from 'sequelize';
import { UserModel } from './user.model.js';
import { CreateUserInput, UserRecord } from './user.schema.js';

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
}

function toRecord(user: UserModel): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export class SequelizeUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await UserModel.findOne({
      where: where(fn('LOWER', col('email')), email.toLowerCase()),
    });
    return user ? toRecord(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await UserModel.findByPk(id);
    return user ? toRecord(user) : null;
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    return toRecord(await UserModel.create(input));
  }
}
