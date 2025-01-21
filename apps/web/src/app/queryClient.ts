import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/ApiError';

const MAX_RETRIES = 2;

// a 404 or a 422 will answer the same way however many times it's asked, so
// retrying one only delays showing the user what happened. a 5xx or a dropped
// connection is worth another go.
function retry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.isClientError) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry,
        // catalog and taxonomy barely move. half a minute of reuse stops a
        // back-navigation from refetching everything the user just looked at.
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        // a mutation isn't idempotent. adding to a cart twice adds twice.
        retry: false,
      },
    },
  });
}
