import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '../config/env.js';
import { tooManyRequests } from '../utils/AppError.js';

// Keyed on req.ip, which is only the caller's address if `trust proxy` matches the
// deployment (see TRUST_PROXY_HOPS). Get that wrong behind a proxy and every request
// keys on the proxy's own address, so the whole user base shares one budget and one
// busy client locks everyone out.
//
// The store is in-process, so each instance counts its own traffic. Fine for one
// container, and the ceiling is per instance once there are several.
// TODO: swap in a redis store when this runs more than one api process.

const windowMs = env.RATE_LIMIT_WINDOW_MINUTES * 60_000;

export function createRateLimiter(max: number): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    limit: max,
    // draft-7 puts the budget in RateLimit/RateLimit-Policy, so a client can back
    // off before it gets refused
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // through the error handler, so a 429 has the same body shape as every other
    // failure and carries a request id
    handler: (_req, _res, next) => {
      next(tooManyRequests());
    },
  });
}

export const apiLimiter: RateLimitRequestHandler = createRateLimiter(env.RATE_LIMIT_MAX);

export const authLimiter: RateLimitRequestHandler = createRateLimiter(env.AUTH_RATE_LIMIT_MAX);
