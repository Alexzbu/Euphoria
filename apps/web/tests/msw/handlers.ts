import { HttpResponse, http, type HttpHandler } from 'msw';
import { API_URL } from '../../src/config/env';
import { makeCart, makeProduct, makeProductDetail, makePage, taxonomy } from '../fixtures';
import type { TaxonomyKind, User } from '../../src/api/types';

const url = (path: string): string => `${API_URL}${path}`;

// the envelope the api wraps every failure in. a plain 401 with no body sends the
// client down its "unexpected response" branch, which isn't what a test asking for
// a 401 usually means.
export function apiError(status: number, code: string, message = code): HttpResponse {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export const unauthorized = (): HttpResponse => apiError(401, 'UNAUTHENTICATED', 'Not signed in');

// swap the default anonymous /auth/me for a signed-in one:
//   server.use(signedInAs(customer))
export const signedInAs = (user: User): HttpHandler =>
  http.get(url('/auth/me'), () => HttpResponse.json({ user }));

export const products = [
  makeProduct(),
  makeProduct({ id: 'p-2', name: 'Wool Coat', slug: 'wool-coat', priceCents: 24_900 }),
];

// enough for a page to render without every test declaring its own api. anything a
// test actually cares about it overrides with server.use().
export const handlers: HttpHandler[] = [
  http.get(url('/taxonomy'), () => HttpResponse.json(taxonomy)),

  http.get(url('/taxonomy/:kind'), ({ params }) => {
    const kind = params.kind as TaxonomyKind;
    return HttpResponse.json({ items: taxonomy[kind] ?? [] });
  }),

  http.get(url('/products'), () => HttpResponse.json(makePage(products))),

  http.get(url('/products/:id'), ({ params }) => {
    const product = products.find((item) => item.id === params.id);
    if (!product) return apiError(404, 'NOT_FOUND', 'No such product');
    return HttpResponse.json({ product: makeProductDetail(product) });
  }),

  http.get(url('/auth/me'), () => unauthorized()),
  http.post(url('/auth/refresh'), () => unauthorized()),
  http.post(url('/auth/logout'), () => new HttpResponse(null, { status: 204 })),

  http.get(url('/cart'), () => HttpResponse.json(makeCart())),
];
