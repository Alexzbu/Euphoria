import type { RequestHandler } from 'express';
import type { RoleName } from '../models/Role.js';
import { verifyAccessToken } from '../services/tokenService.js';
import { forbidden, unauthorized } from '../utils/AppError.js';

// authorization is declared per route, right next to the route it protects. the
// global version, one middleware matching request paths against a pattern list,
// means adding an endpoint silently inherits whatever the patterns happen to
// match, and nothing at the route itself tells you whether it's public.

const BEARER = 'Bearer ';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.get('authorization');

  if (header === undefined || !header.startsWith(BEARER)) {
    next(unauthorized('Authentication required'));
    return;
  }

  try {
    req.auth = verifyAccessToken(header.slice(BEARER.length));
    next();
  } catch (error) {
    next(error);
  }
};

// mount after requireAuth. the missing-identity case is checked rather than
// assumed, because reading a role off an absent identity throws, and a middleware
// that throws answers 500 where it owes a 401. "not signed in" and "signed in but
// not allowed" are different answers.
export const requireRole =
  (...allowed: readonly RoleName[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) {
      next(unauthorized('Authentication required'));
      return;
    }

    if (!allowed.includes(req.auth.role)) {
      next(forbidden(`This action requires the ${allowed.join(' or ')} role`));
      return;
    }

    next();
  };
