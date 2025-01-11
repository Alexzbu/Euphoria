import { Router } from 'express';
import {
  googleCallbackHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from '../controllers/authController.js';
import { isGoogleConfigured, passport } from '../config/passport.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter: Router = Router();

if (isGoogleConfigured) {
  authRouter.get(
    '/google',
    passport.authenticate('google', { session: false, scope: ['profile', 'email'] }),
  );
  authRouter.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failed' }),
    asyncHandler(googleCallbackHandler),
  );
}

authRouter.post('/register', asyncHandler(registerHandler));
authRouter.post('/login', asyncHandler(loginHandler));
authRouter.post('/refresh', asyncHandler(refreshHandler));
authRouter.post('/logout', asyncHandler(logoutHandler));
authRouter.get('/me', asyncHandler(meHandler));
