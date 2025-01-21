import { createContext } from 'react';
import type { User } from '../../api/types';
import type { Credentials } from '../../api/auth';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthValue {
  user: User | null;
  status: AuthStatus;
  isAdmin: boolean;
  login: (credentials: Credentials) => Promise<User>;
  register: (credentials: Credentials) => Promise<User>;
  logout: () => Promise<void>;
}

// undefined, so useAuth can tell "no provider above me" from "provider says nobody
// is signed in"
export const AuthContext = createContext<AuthValue | undefined>(undefined);
