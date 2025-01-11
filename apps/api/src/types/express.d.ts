import type { AccessTokenClaims } from '../services/tokenService.js';

declare global {
  namespace Express {
    interface Request {
      // set by requireAuth, nothing else. kept separate from `user`, which
      // passport owns during the oauth round trip. optional because a route that
      // hasn't run requireAuth genuinely has no identity.
      auth?: AccessTokenClaims;
    }
  }
}

export {};
