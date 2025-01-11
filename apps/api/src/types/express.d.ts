import type { AccessTokenClaims } from '../services/tokenService.js';
import type { ValidatedRequest } from '../middleware/validate.js';

declare global {
  namespace Express {
    interface Request {
      // set by requireAuth, nothing else. kept separate from `user`, which
      // passport owns during the oauth round trip. optional because a route that
      // hasn't run requireAuth genuinely has no identity.
      auth?: AccessTokenClaims;

      // set by validate(), read back through validated(). separate from
      // params/query/body because express 5 makes `query` read-only.
      validated?: ValidatedRequest;
    }
  }
}

export {};
