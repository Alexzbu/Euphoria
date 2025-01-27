import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../../api/auth';
import { ApiError } from '../../api/ApiError';
import { onSessionExpired } from '../../api/client';
import type { Credentials } from '../../api/auth';
import type { User } from '../../api/types';
import { AUTH_QUERY_KEY, AuthContext, type AuthStatus, type AuthValue } from './AuthContext';

// Identity comes from /auth/me and only from there. A role kept client-side is a
// value the user can edit, and a UI that hides the admin link because localStorage
// says CUSTOMER hides nothing at all.
//
// On a cold load there's no access token in memory yet, so this 401s. That's the
// point: the client's interceptor takes the 401, spends the refresh cookie, and
// replays the call. No cookie means no session, and null here means anonymous.
async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await authApi.getCurrentUser();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const queryClient = useQueryClient();

  const { data: user = null, isPending } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    // the interceptor already retried this once with a fresh token. a second 401
    // is an answer, not a hiccup.
    retry: false,
    staleTime: Infinity,
  });

  // everything cached was fetched as whoever was signed in a moment ago. carts and
  // orders are per-user, so the safe move on any identity change is to drop the lot.
  //
  // reset, not clear. removing a query doesn't notify the observers already watching
  // it, so clearing the cache would strand this provider's own /auth/me observer on
  // the query it had before and the new identity would never arrive. reset drops the
  // data and refetches whatever is on screen, and the identity itself is set here
  // rather than refetched.
  const replaceIdentity = useCallback(
    (next: User | null) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, next);
      void queryClient.resetQueries({
        predicate: (query) => query.queryKey[0] !== AUTH_QUERY_KEY[0],
      });
    },
    [queryClient],
  );

  useEffect(
    () =>
      onSessionExpired(() => {
        replaceIdentity(null);
      }),
    [replaceIdentity],
  );

  const login = useCallback(
    async (credentials: Credentials) => {
      const session = await authApi.login(credentials);
      replaceIdentity(session.user);
      return session.user;
    },
    [replaceIdentity],
  );

  const register = useCallback(
    async (credentials: Credentials) => {
      const session = await authApi.register(credentials);
      replaceIdentity(session.user);
      return session.user;
    },
    [replaceIdentity],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    replaceIdentity(null);
  }, [replaceIdentity]);

  const value = useMemo<AuthValue>(() => {
    const status: AuthStatus = isPending ? 'loading' : user ? 'authenticated' : 'anonymous';

    return {
      user,
      status,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
    };
  }, [user, isPending, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
