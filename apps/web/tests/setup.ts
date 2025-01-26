import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setAccessToken } from '../src/api/client';
import { clearGuestCart } from '../src/features/cart/guestCart';
import { server } from './msw/server';

// an unhandled request means a component reached for an endpoint the test never
// planned for. failing there is a lot cheaper than a query that hangs until the
// test times out with nothing to say about why.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  // the guest cart keeps a module-level snapshot for useSyncExternalStore, so
  // clearing localStorage alone would leave the previous test's lines in memory
  clearGuestCart();
  setAccessToken(null);
});

afterAll(() => {
  server.close();
});
