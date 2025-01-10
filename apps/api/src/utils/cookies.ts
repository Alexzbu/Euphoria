import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';

// refresh token lives in an httpOnly cookie so page scripts can't read it. the
// access token stays in memory client-side, short lifetime limits the damage.
//
// flags come from parsed env, already booleans. reading process.env here would
// break it: `secure: process.env.COOKIE_SECURE` is truthy for the string "false".

export const REFRESH_COOKIE = 'euphoria_refresh';

// scoped to auth routes so it isn't sent with every catalog request
const COOKIE_PATH = '/api/auth';

function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: COOKIE_PATH,
    ...(env.COOKIE_DOMAIN === undefined ? {} : { domain: env.COOKIE_DOMAIN }),
  };
}

export function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(), expires: expiresAt });
}

// has to repeat path, domain and the sameSite/secure pair. the browser matches
// a removal on those attributes, so a mismatch leaves the cookie sitting there
// while looking like it worked.
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, baseOptions());
}

export function readRefreshCookie(cookies: Record<string, unknown>): string | undefined {
  const value = cookies[REFRESH_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
