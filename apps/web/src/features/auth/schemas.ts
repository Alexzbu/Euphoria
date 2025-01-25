import { z } from 'zod';

// The server validates all of this again, and its copy is the one that decides.
// This one exists so a mistyped email costs a glance instead of a round trip, and
// so both forms agree on what a password has to look like.

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt stops reading at 72 bytes, so anything past that isn't part of the password
export const MAX_PASSWORD_BYTES = 72;

const byteLength = (value: string): number => new TextEncoder().encode(value).length;

const emailField = z.string().trim().toLowerCase().email('Enter a valid email address');

export const loginSchema = z.object({
  email: emailField,
  // no policy here on purpose. the rules are there to stop weak passwords being
  // created, and applying them at sign-in tells anyone typing that this account's
  // password is shorter than the minimum.
  password: z.string().min(1, 'Enter your password'),
});

export const registerSchema = z
  .object({
    email: emailField,
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Use at least ${String(MIN_PASSWORD_LENGTH)} characters`)
      .refine((value) => byteLength(value) <= MAX_PASSWORD_BYTES, 'That password is too long'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'The two passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

// zod reports every issue; a form shows one message per field, the first one
export function fieldErrors<T extends Record<string, unknown>>(
  error: z.ZodError,
): Partial<Record<keyof T, string>> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const [field] = issue.path;
    if (typeof field === 'string' && !(field in errors)) errors[field] = issue.message;
  }

  return errors as Partial<Record<keyof T, string>>;
}
