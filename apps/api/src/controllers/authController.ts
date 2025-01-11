import type { Request, Response } from 'express';
import type { TypeOf, ZodTypeAny } from 'zod';
import * as authService from '../services/authService.js';
import { revokeRefreshToken } from '../services/refreshTokenService.js';
import { loginSchema, registerSchema } from '../schemas/auth.js';
import { badRequest, unauthorized } from '../utils/AppError.js';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../utils/cookies.js';
import type { AuthResult } from '../services/authService.js';
import type { UserDocument } from '../models/User.js';
import { env } from '../config/env.js';

function respondWithSession(res: Response, result: AuthResult, status = 200): void {
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  res.status(status).json({ accessToken: result.accessToken, user: result.user });
}

function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): TypeOf<S> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw badRequest('Request body is not valid', parsed.error.issues);
  }
  return parsed.data;
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = parseBody(registerSchema, req.body);
  respondWithSession(res, await authService.register(email, password), 201);
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = parseBody(loginSchema, req.body);
  respondWithSession(res, await authService.login(email, password));
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const token = readRefreshCookie(req.cookies as Record<string, unknown>);
  if (!token) throw unauthorized('No refresh token was provided');

  respondWithSession(res, await authService.refresh(token));
}

// 204 whether or not a token was there. sign-out is a request to end up signed out
// and the caller gets there either way.
export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const token = readRefreshCookie(req.cookies as Record<string, unknown>);
  if (token) await revokeRefreshToken(token);

  clearRefreshCookie(res);
  res.status(204).send();
}

// the access token deliberately doesn't travel in the redirect url: query strings
// land in browser history, server logs, and the Referer of the next request. the
// cookie is httpOnly and scoped.
export async function googleCallbackHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as UserDocument | undefined;
  if (!user) throw unauthorized('Google sign-in did not return an account');

  const result = await authService.issueSessionFor(user);
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  res.redirect(`${env.WEB_ORIGIN}/auth/callback`);
}

// behind requireAuth, so the claims are guaranteed present
export async function meHandler(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw unauthorized('Authentication required');

  res.json({ user: await authService.currentUser(req.auth.sub) });
}
