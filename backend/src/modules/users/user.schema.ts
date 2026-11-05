import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'viewer']);

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  createdAt: z.string().datetime(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type UserRecord = PublicUser & { passwordHash: string };

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  passwordHash: z.string().min(1),
  role: userRoleSchema.default('viewer'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
