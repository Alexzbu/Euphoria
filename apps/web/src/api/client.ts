import { API_URL } from '../config/env';
import { ApiError, errorFromResponse, NETWORK_ERROR_STATUS } from './ApiError';
import type { Session } from './types';

// The access token lives here, in memory, and nowhere else. localStorage survives
// the tab and is readable by any script that gets injected into the page; a
// variable in a module dies with the tab. Refresh is what makes that survivable:
// the long-lived credential is an httpOnly cookie the api set, which script can't
// read but the browser still sends.

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

type Listener = () => void;

const expiryListeners = new Set<Listener>();

// the auth context subscribes to this. the client knows the session is gone before
// anything else does, but deciding what the user sees isn't its job.
export function onSessionExpired(listener: Listener): () => void {
  expiryListeners.add(listener);
  return () => expiryListeners.delete(listener);
}

export type QueryValue = string | number | boolean | string[] | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

// repeated filters go over as ?brand=nike,adidas, the form the api parses. an
// empty array is dropped: sending brand= would be a filter matching nothing,
// which isn't what "no brand selected" means.
function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_URL}${path}`);
  if (!query) return url.toString();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) url.searchParams.set(key, value.join(','));
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function buildInit(options: RequestOptions): RequestInit {
  const headers = new Headers();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const isFormData = options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) headers.set('Content-Type', 'application/json');

  return {
    method: options.method ?? 'GET',
    headers,
    // the refresh cookie is httpOnly and scoped to /api/auth, so it only actually
    // travels on the refresh and logout calls. this flag is what lets it.
    credentials: 'include',
    ...(options.body === undefined
      ? {}
      : { body: isFormData ? (options.body as FormData) : JSON.stringify(options.body) }),
    ...(options.signal ? { signal: options.signal } : {}),
  };
}

async function parse<T>(response: Response): Promise<T> {
  // 204 from a delete, or any empty body. json() on nothing throws.
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return (await response.json()) as T;
}

// One refresh at a time. A page that renders cart, catalog and account together
// fires three requests, and if the token has just expired all three come back 401.
// Three refreshes would rotate the token three times and two of them would be
// presenting a token that was already spent, which logs the user out mid-session.
let refreshing: Promise<string | null> | null = null;

function refreshSession(): Promise<string | null> {
  refreshing ??= sendOnce<Session>('/auth/refresh', { method: 'POST' })
    .then((session) => {
      accessToken = session.accessToken;
      return accessToken;
    })
    .catch(() => {
      accessToken = null;
      return null;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

async function sendOnce<T>(path: string, options: RequestOptions): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), buildInit(options));
  } catch (cause) {
    // fetch only rejects when there was no response at all. an abort is the caller's
    // own doing, so it goes back untouched for react query to recognise.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(NETWORK_ERROR_STATUS, 'NETWORK_ERROR', 'Could not reach the server');
  }

  if (!response.ok) throw await errorFromResponse(response);
  return parse<T>(response);
}

// paths that answer 401 as their normal way of saying no. refreshing after one of
// them would be answering "wrong password" with "let me try that again".
const NO_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await sendOnce<T>(path, options);
  } catch (error) {
    const expired = error instanceof ApiError && error.status === 401;
    if (!expired || NO_RETRY.includes(path)) throw error;

    // whether we were signed in a moment ago. a 401 with no token in hand is the
    // first call of a cold page load, and for an anonymous visitor that's the
    // expected answer, not an expiry worth announcing.
    const hadSession = accessToken !== null;

    if (await refreshSession()) return sendOnce<T>(path, options);

    if (hadSession) for (const listener of expiryListeners) listener();
    throw error;
  }
}
