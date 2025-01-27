import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { getCart } from '../src/api/cart';
import { useAuth } from '../src/features/auth/useAuth';
import { useTaxonomy } from '../src/features/catalog/queries';
import { API_URL } from '../src/config/env';
import { admin, customer, taxonomy } from './fixtures';
import { signedInAs, unauthorized } from './msw/handlers';
import { server } from './msw/server';
import { createWrapper } from './render';
import type { User } from '../src/api/types';

const url = (path: string) => `${API_URL}${path}`;

// /auth/me is the only thing that decides who you are, so the fake server keeps
// the session and the tests move it around
function sessionServer(initial: User | null = null) {
  let user = initial;

  server.use(
    http.get(url('/auth/me'), () => (user ? HttpResponse.json({ user }) : unauthorized())),
    http.post(url('/auth/login'), () => {
      user = customer;
      return HttpResponse.json({ accessToken: 'access-1', user: customer });
    }),
    http.post(url('/auth/logout'), () => {
      user = null;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  return { end: () => (user = null) };
}

const mount = () => renderHook(() => useAuth(), { wrapper: createWrapper() });

describe('AuthProvider', () => {
  it('settles on anonymous when nobody is signed in', async () => {
    const { result } = mount();

    await waitFor(() => {
      expect(result.current.status).toBe('anonymous');
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  // a role kept client-side is a value the user can edit
  it('takes the role from the server, and only from there', async () => {
    server.use(signedInAs(admin));
    const { result } = mount();

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.user).toMatchObject({ email: 'root@example.com' });
  });

  it('signs in and out', async () => {
    sessionServer();
    const { result } = mount();

    await waitFor(() => {
      expect(result.current.status).toBe('anonymous');
    });

    await act(async () => {
      await result.current.login({ email: 'ada@example.com', password: 'correct-horse-battery' });
    });
    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    await act(async () => {
      await result.current.logout();
    });
    await waitFor(() => {
      expect(result.current.status).toBe('anonymous');
    });
  });

  // carts and orders are per-user. anything cached as the last identity is wrong
  // the moment a different one signs in.
  it('drops everything cached when the identity changes', async () => {
    sessionServer();
    let taxonomyReads = 0;
    server.use(
      http.get(url('/taxonomy'), () => {
        taxonomyReads += 1;
        return HttpResponse.json(taxonomy);
      }),
    );

    const { result } = renderHook(() => ({ auth: useAuth(), taxonomy: useTaxonomy() }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.taxonomy.data).toBeDefined();
    });
    expect(taxonomyReads).toBe(1);

    await act(async () => {
      await result.current.auth.login({ email: 'ada@example.com', password: 'pw' });
    });

    await waitFor(() => {
      expect(result.current.auth.status).toBe('authenticated');
    });
    // read again as the new identity, not served from what the last one cached
    await waitFor(() => {
      expect(taxonomyReads).toBe(2);
    });
  });

  it('goes anonymous when the refresh cookie stops working mid-session', async () => {
    const session = sessionServer();
    server.use(
      http.post(url('/auth/refresh'), () => unauthorized()),
      http.get(url('/cart'), () => unauthorized()),
    );

    const { result } = mount();
    await waitFor(() => {
      expect(result.current.status).toBe('anonymous');
    });

    await act(async () => {
      await result.current.login({ email: 'ada@example.com', password: 'pw' });
    });
    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    // the server has forgotten us, so the next call 401s and the refresh that
    // follows it 401s too
    session.end();
    await act(async () => {
      await getCart().catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('anonymous');
    });
  });
});
