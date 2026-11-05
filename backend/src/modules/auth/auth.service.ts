import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UniqueConstraintError } from 'sequelize';
import { ApiError } from '../../common/errors/api-error.js';
import { PublicUser, UserRecord } from '../users/user.schema.js';
import { UserService } from '../users/user.service.js';
import { AuthRepository } from './auth.repository.js';
import { loginSchema, signupSchema } from './auth.schema.js';

const jwtExpiresIn = '1h';

export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly authRepository: AuthRepository,
    private readonly jwtSecret: string,
  ) {}

  async signup(input: unknown): Promise<{ user: PublicUser; token: string }> {
    const result = signupSchema.safeParse(input);
    if (!result.success) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ApiError(400, 'name, email, and password are required');
      }
      throw new ApiError(400, result.error.issues[0]?.message ?? 'Invalid signup input');
    }

    const { name, email, password, role } = result.data;
    if (await this.users.findByEmail(email)) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await this.users.create({ name, email, passwordHash, role });
      return this.createSession(user);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ApiError(409, 'An account with this email already exists');
      }
      throw error;
    }
  }

  async login(input: unknown): Promise<{ user: PublicUser; token: string }> {
    const result = loginSchema.safeParse(input);
    if (!result.success) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ApiError(400, 'email and password are required');
      }
      throw new ApiError(400, result.error.issues[0]?.message ?? 'Invalid login input');
    }

    const user = await this.users.findByEmail(result.data.email);
    if (!user || !(await bcrypt.compare(result.data.password, user.passwordHash))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    return this.createSession(user);
  }

  async logout(token: string): Promise<void> {
    await this.authRepository.revokeToken(this.hashToken(token));
  }

  async authenticate(token: string): Promise<PublicUser> {
    let payload: string | jwt.JwtPayload;
    try {
      payload = jwt.verify(token, this.jwtSecret);
    } catch {
      throw new ApiError(401, 'Invalid or expired token');
    }

    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      throw new ApiError(401, 'Invalid or expired token');
    }
    if (await this.authRepository.isTokenRevoked(this.hashToken(token))) {
      throw new ApiError(401, 'Token has been revoked');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }
    return this.users.toPublicUser(user);
  }

  private createSession(user: UserRecord): { user: PublicUser; token: string } {
    return {
      user: this.users.toPublicUser(user),
      token: jwt.sign(
        { sub: user.id, email: user.email, name: user.name, role: user.role },
        this.jwtSecret,
        { expiresIn: jwtExpiresIn },
      ),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
