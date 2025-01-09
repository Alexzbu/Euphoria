import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { RoleName } from '../models/Role.js';
import { unauthorized } from '../utils/AppError.js';

// the signing key is configuration and nothing else. it must never be built from
// anything that varies per request, no User-Agent, no Accept-Language, no ip. mixing
// request data in means a browser update produces a different key, every token
// already issued fails verification, and users get signed out with no way to explain
// why. worse, it looks exactly like a forged signature in the logs.
//
// binding a session to a device is fair, but it belongs in the claims where a
// mismatch can be detected and reported.

export interface AccessTokenClaims {
  // user id. sub is the registered claim name for the subject of the token.
  sub: string;
  role: RoleName;
}

const ISSUER = 'euphoria-api';

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
    issuer: ISSUER,
  });
}

// 401 instead of letting jsonwebtoken's own error escape. expired and malformed are
// both "you are not authenticated" to the caller.
export function verifyAccessToken(token: string): AccessTokenClaims {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: ISSUER });
  } catch {
    throw unauthorized('Access token is invalid or has expired');
  }

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as AccessTokenClaims).sub !== 'string' ||
    typeof (decoded as AccessTokenClaims).role !== 'string'
  ) {
    throw unauthorized('Access token is missing required claims');
  }

  const { sub, role } = decoded as AccessTokenClaims;
  return { sub, role };
}
