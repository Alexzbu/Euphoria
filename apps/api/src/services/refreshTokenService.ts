import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Types } from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { unauthorized } from '../utils/AppError.js';

// 256 bits of randomness, not signed documents. a jwt carries its own expiry but
// can't be revoked before it, and the whole point is that a session can be ended on
// demand, which needs server-side state anyway.
//
// sha-256 and not bcrypt for the stored hash: bcrypt is slow on purpose to protect
// low-entropy human passwords. a 256-bit random value has nothing to guess, so the
// slowness would buy nothing and sit on the hot path of every refresh.

const TOKEN_BYTES = 32;

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

const hash = (token: string): string => createHash('sha256').update(token).digest('hex');

function expiryFromNow(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function issueRefreshToken(
  userId: Types.ObjectId,
  family: string = randomUUID(),
): Promise<IssuedRefreshToken> {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  const expiresAt = expiryFromNow();

  await RefreshToken.create({ tokenHash: hash(token), user: userId, family, expiresAt });
  return { token, expiresAt };
}

// presenting a token that was already spent means two parties hold the same token
// and only one is the real client. no way to tell which, so the whole family gets
// revoked. ending one valid session is cheaper than leaving a stolen one alive.
export async function rotateRefreshToken(
  token: string,
): Promise<{ userId: Types.ObjectId; issued: IssuedRefreshToken }> {
  const existing = await RefreshToken.findOne({ tokenHash: hash(token) });

  if (!existing) throw unauthorized('Refresh token is not recognised');

  if (existing.revokedAt) {
    logger.warn(
      { user: existing.user.toString(), family: existing.family },
      'Reuse of a spent refresh token, revoking the family',
    );
    await revokeFamily(existing.family);
    throw unauthorized('Refresh token has already been used');
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    throw unauthorized('Refresh token has expired');
  }

  existing.revokedAt = new Date();
  await existing.save();

  const issued = await issueRefreshToken(existing.user, existing.family);
  return { userId: existing.user, issued };
}

// sign-out. unknown or already-revoked tokens aren't an error, the goal is reached either way.
export async function revokeRefreshToken(token: string): Promise<void> {
  await RefreshToken.updateOne(
    { tokenHash: hash(token), revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeFamily(family: string): Promise<void> {
  await RefreshToken.updateMany(
    { family, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}
