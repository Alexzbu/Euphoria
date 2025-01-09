import bcrypt from 'bcrypt';

// 12 rounds is ~300ms. slow enough to be painful to crack, fast enough that login
// doesn't feel broken.
export const BCRYPT_ROUNDS = 12;

// bcrypt cuts off after 72 bytes, so a longer passphrase loses its tail
export const MAX_PASSWORD_BYTES = 72;
export const MIN_PASSWORD_LENGTH = 8;

export async function hashPassword(plain: string): Promise<string> {
  if (Buffer.byteLength(plain, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new Error(`Password must be at most ${String(MAX_PASSWORD_BYTES)} bytes`);
  }
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

// false for an account with no password, eg one registered through an identity
// provider. comparing against undefined throws, and a login route that throws
// returns 500 where it owes the caller a 401.
export async function verifyPassword(plain: string, hash: string | undefined): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

// true for a value bcrypt produced. avoids double-hashing an already-hashed field.
export function looksHashed(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}
