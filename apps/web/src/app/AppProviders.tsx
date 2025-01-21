import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '../features/auth/AuthProvider';
import { createQueryClient } from './queryClient';

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  // useState, not a module constant. a client created at import time is shared by
  // every test in a file, so one test's cached data shows up in the next.
  const [queryClient] = useState(createQueryClient);

  // boundary outermost, so a throw from the provider itself still lands in a
  // fallback instead of a blank page. the client survives it either way, it's held
  // in state above here.
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
