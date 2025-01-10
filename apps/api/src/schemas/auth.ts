import { z } from 'zod';
import { MAX_PASSWORD_BYTES, MIN_PASSWORD_LENGTH } from '../services/passwordService.js';

export const emailField = z.string().trim().toLowerCase().email('Enter a valid email address');

export const registerSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters`)
    .refine(
      (value) => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES,
      `Password must be at most ${String(MAX_PASSWORD_BYTES)} bytes`,
    ),
});

// login deliberately doesn't apply the password policy. the rule is there to stop
// weak passwords being created. applying it at sign-in would reject a short
// password with a different message than a wrong one, which tells an attacker
// whether the account exists and roughly what its password looks like.
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
