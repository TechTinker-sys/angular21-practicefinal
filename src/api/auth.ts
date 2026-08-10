import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface SignupInput {
  name?: string;
  email?: string;
  password?: string;
}

interface LoginInput {
  email?: string;
  password?: string;
}

const usersStore = new Map<string, User>();
const tokenBlacklist = new Set<string>();

const JWT_SECRET = process.env['JWT_SECRET'] || 'dev-secret-change-me-in-production';
const JWT_EXPIRES_IN = '1h';

const router = Router();

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function signToken(user: User): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function getUserByEmail(email: string): User | undefined {
  for (const user of usersStore.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
  }
  return undefined;
}

function getUserById(id: string): User | undefined {
  return usersStore.get(id);
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const user = getUserById(payload.sub as string);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    (req as Request & { user?: PublicUser }).user = toPublicUser(user);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.post('/signup', async (req, res) => {
  const input = req.body as SignupInput;
  const name = input?.name?.trim();
  const email = input?.email?.trim().toLowerCase();
  const password = input?.password;

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

  if (getUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = {
    id: randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  usersStore.set(user.id, user);

  const token = signToken(user);
  return res.status(201).json({ user: toPublicUser(user), token });
});

router.post('/login', async (req, res) => {
  const input = req.body as LoginInput;
  const email = input?.email?.trim().toLowerCase();
  const password = input?.password;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = getUserByEmail(email);
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

router.post('/logout', authenticateToken, (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (token) {
    tokenBlacklist.add(token);
  }

  return res.status(204).send();
});

router.get('/me', authenticateToken, (req, res) => {
  const user = (req as Request & { user?: PublicUser }).user;
  return res.json({ user });
});

export { router as authRouter, usersStore, tokenBlacklist, toPublicUser, signToken, getUserByEmail, getUserById };