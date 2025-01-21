// One place that knows what a url looks like. A link built by hand somewhere in a
// component is a link nothing updates when the route moves.
export const ROUTES = {
  home: '/',
  catalog: '/catalog',
  product: '/products/:id',
  cart: '/cart',
  checkout: '/checkout',
  login: '/login',
  register: '/register',
  // where the api sends the browser back after google sign-in
  authCallback: '/auth/callback',
  account: '/account',
  admin: '/admin',
  adminProducts: '/admin/products',
  adminTaxonomy: '/admin/taxonomy',
} as const;

export const productPath = (id: string): string => `/products/${id}`;
