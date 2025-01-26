import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/features/auth/AuthProvider';
import type { ComponentType, ReactElement, ReactNode } from 'react';

// no retries and no cache reuse. the app retries 5xx twice, which in a test only
// buys three identical failures and a slower run.
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

export interface WrapperOptions {
  route?: string;
  /** route pattern to mount under, for anything reading useParams */
  path?: string;
  queryClient?: QueryClient;
}

export function createWrapper(options: WrapperOptions = {}): ComponentType<{
  children: ReactNode;
}> {
  const { route = '/', path, queryClient = createTestQueryClient() } = options;

  return function Providers({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {path ? (
              <Routes>
                <Route path={path} element={children} />
              </Routes>
            ) : (
              children
            )}
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}

export interface Rendered extends RenderResult {
  queryClient: QueryClient;
  user: ReturnType<typeof userEvent.setup>;
}

export function renderWithProviders(ui: ReactElement, options: WrapperOptions = {}): Rendered {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const result: RenderResult = render(ui, {
    wrapper: createWrapper({ ...options, queryClient }),
  });

  return { ...result, queryClient, user: userEvent.setup() };
}
