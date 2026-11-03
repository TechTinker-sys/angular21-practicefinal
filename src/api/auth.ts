import { createHash } from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UniqueConstraintError, fn, col, where } from 'sequelize';
import { RevokedToken } from './models/RevokedToken';
import { User, UserRole } from './models/User';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface SignupInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

interface LoginInput {
  email?: string;
  password?: string;
}

const JWT_SECRET = process.env['JWT_SECRET'] || 'dev-secret-change-me-in-production';
const JWT_EXPIRES_IN = '1h';

const router = Router();

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function signToken(user: User): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function getUserByEmail(email: string): Promise<User | null> {
  return User.findOne({
    where: where(fn('LOWER', col('email')), email.toLowerCase()),
  });
}

export function authorizeRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: PublicUser }).user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ error: 'You do not have permission to perform this action' });
      return;
    }

    next();
  };
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const revokedToken = await RevokedToken.findByPk(hashToken(token));
  if (revokedToken) {
    res.status(401).json({ error: 'Token has been revoked' });
    return;
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    res.status(401).json({ error: 'User no longer exists' });
    return;
  }

  (req as Request & { user?: PublicUser }).user = toPublicUser(user);
  next();
}

router.post('/signup', async (req, res) => {
  const input = req.body as SignupInput;
  const name = input?.name?.trim();
  const email = input?.email?.trim().toLowerCase();
  const password = input?.password;
  const requestedRole = input?.role;
  const role: UserRole = requestedRole === 'admin' || requestedRole === 'viewer' ? requestedRole : 'viewer';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  if (name.length < 2) {
    return res.status(400).json({ error: 'name must be at least 2 characters' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'email must be a valid email address' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  if (await getUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ name, email, passwordHash, role });
    const token = signToken(user);
    return res.status(201).json({ user: toPublicUser(user), token });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    throw error;
  }
});

router.post('/login', async (req, res) => {
  const input = req.body as LoginInput;
  const email = input?.email?.trim().toLowerCase();
  const password = input?.password;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);
  return res.json({ user: toPublicUser(user), token });
});

router.post('/logout', authenticateToken, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (token) {
    await RevokedToken.findOrCreate({
      where: { tokenHash: hashToken(token) },
      defaults: { tokenHash: hashToken(token) },
    });
  }

  return res.status(204).send();
});

router.get('/me', authenticateToken, (req, res) => {
  const user = (req as Request & { user?: PublicUser }).user;
  return res.json({ user });
});

export { router as authRouter, getUserByEmail };
