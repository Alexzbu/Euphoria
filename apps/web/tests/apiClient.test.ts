import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api/ApiError';
import { login } from '../src/api/auth';
import { getCart } from '../src/api/cart';
import { listProducts } from '../src/api/catalog';
import { request, setAccessToken } from '../src/api/client';
import { API_URL } from '../src/config/env';
import { customer, makeCart } from './fixtures';
import { apiError, unauthorized } from './msw/handlers';
import { server } from './msw/server';

const url = (path: string) => `${API_URL}${path}`;

describe('api client', () => {
  it('spends the refresh cookie on a 401 and replays the call', async () => {
    let tokenSeen: string | null = null;
    let attempts = 0;

    server.use(
      http.post(url('/auth/refresh'), () =>
        HttpResponse.json({ accessToken: 'fresh', user: customer }),
      ),
      http.get(url('/cart'), ({ request }) => {
        attempts += 1;
        if (attempts === 1) return unauthorized();
        tokenSeen = request.headers.get('Authorization');
        return HttpResponse.json(makeCart());
      }),
    );

    setAccessToken('stale');
    await expect(getCart()).resolves.toMatchObject({ totalItems: 0 });

    expect(attempts).toBe(2);
    expect(tokenSeen).toBe('Bearer fresh');
  });

  // three widgets on a page all 401 at once. two of them refreshing again would be
  // presenting a token that was already spent, and that logs the user out.
  it('refreshes once for calls that fail together', async () => {
    let refreshes = 0;
    const expired = new Set(['/cart', '/products', '/orders']);

    server.use(
      http.post(url('/auth/refresh'), async () => {
        refreshes += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return HttpResponse.json({ accessToken: 'fresh', user: customer });
      }),
      http.get(url('/cart'), () =>
        expired.delete('/cart') ? unauthorized() : HttpResponse.json(makeCart()),
      ),
      http.get(url('/products'), () =>
        expired.delete('/products') ? unauthorized() : HttpResponse.json({ items: [] }),
      ),
      http.get(url('/orders'), () =>
        expired.delete('/orders') ? unauthorized() : HttpResponse.json({ items: [] }),
      ),
    );

    setAccessToken('stale');
    await Promise.all([getCart(), listProducts(), request('/orders')]);

    expect(refreshes).toBe(1);
  });

  // a wrong password answers 401 too. refreshing after one would be answering
  // "wrong password" with "let me try that again".
  it('does not try to refresh a rejected sign-in', async () => {
    let refreshes = 0;

    server.use(
      http.post(url('/auth/refresh'), () => {
        refreshes += 1;
        return unauthorized();
      }),
      http.post(url('/auth/login'), () => apiError(401, 'INVALID_CREDENTIALS', 'Wrong password')),
    );

    const error = await login({ email: 'ada@example.com', password: 'nope' }).catch(
      (cause: unknown) => cause,
    );

    expect(error).toMatchObject({ status: 401, message: 'Wrong password' });
    expect(refreshes).toBe(0);
  });

  it('unwraps the api error envelope', async () => {
    server.use(http.get(url('/products/p-9'), () => apiError(404, 'NOT_FOUND', 'No such product')));

    const error = await request('/products/p-9').catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'No such product' });
  });

  // a proxy answering 502 in html would otherwise surface as a SyntaxError and lose
  // the real status
  it('survives a failure that is not json', async () => {
    server.use(
      http.get(url('/products'), () => new HttpResponse('<h1>Bad Gateway</h1>', { status: 502 })),
    );

    const error = await listProducts().catch((cause: unknown) => cause);
    expect(error).toMatchObject({ status: 502, code: 'UNEXPECTED_RESPONSE' });
  });

  it('reports an unreachable server as a network error, not a crash', async () => {
    server.use(http.get(url('/products'), () => HttpResponse.error()));

    const error = await listProducts().catch((cause: unknown) => cause);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
    expect((error as ApiError).isNetworkError).toBe(true);
  });

  it('sends repeated filters as one comma list and drops the empty ones', async () => {
    let seen = '';
    server.use(
      http.get(url('/products'), ({ request }) => {
        seen = new URL(request.url).search;
        return HttpResponse.json({ items: [] });
      }),
    );

    await listProducts({ brand: ['nike', 'adidas'], size: [], page: 2 });
    expect(seen).toBe('?brand=nike%2Cadidas&page=2');
  });
});
