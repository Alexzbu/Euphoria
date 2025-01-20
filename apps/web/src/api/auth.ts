import { request, setAccessToken } from './client';
import type { Session, User } from './types';

export interface Credentials {
  email: string;
  password: string;
}

export async function register(input: Credentials): Promise<Session> {
  const session = await request<Session>('/auth/register', { method: 'POST', body: input });
  setAccessToken(session.accessToken);
  return session;
}

export async function login(input: Credentials): Promise<Session> {
  const session = await request<Session>('/auth/login', { method: 'POST', body: input });
  setAccessToken(session.accessToken);
  return session;
}

// the cookie is the only thing that survives a reload, so signing out has to reach
// the server. dropping the in-memory token alone would leave a session that comes
// back on the next refresh.
export async function logout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}

export async function getCurrentUser(): Promise<User> {
  const { user } = await request<{ user: User }>('/auth/me');
  return user;
}
