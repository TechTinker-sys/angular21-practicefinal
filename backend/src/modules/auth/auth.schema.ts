import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'name must be at least 2 characters').max(120),
  email: z.string().trim().email('email must be a valid email address').max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(6, 'password must be at least 6 characters'),
  role: z
    .enum(['admin', 'viewer'])
    .catch('viewer')
    .default('viewer'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('email and password are required').transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'email and password are required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
