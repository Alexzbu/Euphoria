import { test as base, type Page, type Route } from '@playwright/test';
import type {
  Cart,
  CartLine,
  Order,
  OrderLine,
  ProductDetail,
  ShippingAddress,
  TaxonomyMap,
  User,
} from '../src/api/types';

// A whole api in the page, so the flow can run against the real bundle without a
// database, a stripe key or a second process. It holds state the way the server
// does: the cart belongs to the session, and placing an order empties it.

const BLACK = { id: 'c-black', name: 'Black', slug: 'black' };
const MEDIUM = { id: 's-m', name: 'M', slug: 'm' };
const LARGE = { id: 's-l', name: 'L', slug: 'l' };

const taxonomy: TaxonomyMap = {
  brands: [{ id: 'b-nike', name: 'Nike', slug: 'nike' }],
  categories: [{ id: 'k-tops', name: 'Tops', slug: 'tops' }],
  colors: [BLACK],
  sizes: [MEDIUM, LARGE],
  sexes: [{ id: 'x-women', name: 'Women', slug: 'women' }],
};

const TEE: ProductDetail = {
  id: 'p-tee',
  name: 'Ribbed Tee',
  slug: 'ribbed-tee',
  description: 'Heavy cotton, boxy fit.',
  priceCents: 4_500,
  images: [],
  brand: taxonomy.brands[0]!,
  category: taxonomy.categories[0]!,
  sex: taxonomy.sexes[0]!,
  createdAt: '2025-01-10T09:00:00.000Z',
  variants: [
    { id: 'v-m', sku: 'TEE-BLK-M', stock: 6, inStock: true, color: BLACK, size: MEDIUM },
    { id: 'v-l', sku: 'TEE-BLK-L', stock: 2, inStock: true, color: BLACK, size: LARGE },
  ],
};

const COAT: ProductDetail = {
  ...TEE,
  id: 'p-coat',
  name: 'Wool Coat',
  slug: 'wool-coat',
  description: 'Double faced wool.',
  priceCents: 24_900,
  variants: [
    { id: 'v-coat-m', sku: 'COAT-BLK-M', stock: 3, inStock: true, color: BLACK, size: MEDIUM },
  ],
};

const CATALOG = [TEE, COAT];

const USER: User = { id: 'u-1', email: 'ada@example.com', role: 'CUSTOMER' };
const PASSWORD = 'correct-horse-battery';

interface ServerLine {
  variantId: string;
  quantity: number;
}

function findVariant(variantId: string) {
  for (const product of CATALOG) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

function toCart(lines: ServerLine[]): Cart {
  const items: CartLine[] = [];

  for (const line of lines) {
    const match = findVariant(line.variantId);
    if (!match) continue;

    const { product, variant } = match;
    items.push({
      id: `line-${variant.id}`,
      variantId: variant.id,
      sku: variant.sku,
      quantity: line.quantity,
      stock: variant.stock,
      unitPriceCents: product.priceCents,
      lineTotalCents: product.priceCents * line.quantity,
      product: { id: product.id, name: product.name, slug: product.slug, images: product.images },
      color: variant.color,
      size: variant.size,
    });
  }

  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}

class FakeApi {
  private user: User | null = null;
  private lines: ServerLine[] = [];
  private orders: Order[] = [];

  async install(page: Page): Promise<void> {
    await page.route('**/api/**', (route) => this.handle(route));
  }

  private json(route: Route, body: unknown, status = 200): Promise<void> {
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  }

  private fail(route: Route, status: number, code: string, message = code): Promise<void> {
    return this.json(route, { error: { code, message } }, status);
  }

  private add(variantId: string, quantity: number): void {
    const existing = this.lines.find((line) => line.variantId === variantId);
    const stock = findVariant(variantId)?.variant.stock ?? 0;

    if (existing) existing.quantity = Math.min(existing.quantity + quantity, stock);
    else this.lines.push({ variantId, quantity: Math.min(quantity, stock) });
  }

  private placeOrder(address: ShippingAddress): Order {
    const cart = toCart(this.lines);
    const items: OrderLine[] = cart.items.map((line, index) => ({
      id: `ol-${String(index)}`,
      variantId: line.variantId,
      productId: line.product.id,
      productName: line.product.name,
      productSlug: line.product.slug,
      sku: line.sku,
      colorName: line.color.name,
      sizeName: line.size.name,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
      lineTotalCents: line.lineTotalCents,
    }));

    const order: Order = {
      id: `o-${String(this.orders.length + 1)}`,
      orderNumber: `EU-2501-000${String(this.orders.length + 1)}`,
      status: 'PENDING_PAYMENT',
      items,
      subtotalCents: cart.subtotalCents,
      shippingCents: 0,
      totalCents: cart.subtotalCents,
      currency: 'USD',
      shippingAddress: address,
      placedAt: new Date().toISOString(),
    };

    this.orders.push(order);
    this.lines = [];
    return order;
  }

  private async handle(route: Route): Promise<void> {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    const method = request.method();
    const body = <T>(): T => request.postDataJSON() as T;

    if (method === 'GET' && path === '/taxonomy') return this.json(route, taxonomy);

    if (method === 'GET' && path === '/products') {
      const items = CATALOG.map(({ variants: _variants, ...summary }) => summary);
      return this.json(route, { items, page: 1, limit: 12, total: items.length, totalPages: 1 });
    }

    if (method === 'GET' && path.startsWith('/products/')) {
      const product = CATALOG.find((item) => item.id === path.slice('/products/'.length));
      if (!product) return this.fail(route, 404, 'NOT_FOUND', 'No such product');
      return this.json(route, { product });
    }

    if (method === 'GET' && path === '/auth/me') {
      if (!this.user) return this.fail(route, 401, 'UNAUTHENTICATED', 'Not signed in');
      return this.json(route, { user: this.user });
    }

    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = body<{ email: string; password: string }>();
      if (email !== USER.email || password !== PASSWORD) {
        return this.fail(route, 401, 'INVALID_CREDENTIALS', 'Email or password is wrong');
      }
      this.user = USER;
      return this.json(route, { accessToken: 'e2e-access-token', user: USER });
    }

    if (method === 'POST' && path === '/auth/refresh') {
      if (!this.user) return this.fail(route, 401, 'UNAUTHENTICATED', 'No session');
      return this.json(route, { accessToken: 'e2e-access-token', user: this.user });
    }

    if (method === 'POST' && path === '/auth/logout') {
      this.user = null;
      return route.fulfill({ status: 204, body: '' });
    }

    if (path.startsWith('/cart') || path.startsWith('/orders')) {
      if (!this.user) return this.fail(route, 401, 'UNAUTHENTICATED', 'Not signed in');
    }

    if (method === 'GET' && path === '/cart') return this.json(route, toCart(this.lines));

    if (method === 'POST' && path === '/cart/items') {
      const { variantId, quantity } = body<{ variantId: string; quantity: number }>();
      this.add(variantId, quantity);
      return this.json(route, toCart(this.lines));
    }

    if (method === 'POST' && path === '/cart/merge') {
      const { items } = body<{ items: ServerLine[] }>();
      for (const item of items) this.add(item.variantId, item.quantity);
      return this.json(route, toCart(this.lines));
    }

    if (method === 'PATCH' && path.startsWith('/cart/items/')) {
      const id = path.slice('/cart/items/'.length);
      const line = this.lines.find((item) => `line-${item.variantId}` === id);
      if (line) line.quantity = body<{ quantity: number }>().quantity;
      return this.json(route, toCart(this.lines));
    }

    if (method === 'DELETE' && path.startsWith('/cart/items/')) {
      const id = path.slice('/cart/items/'.length);
      this.lines = this.lines.filter((item) => `line-${item.variantId}` !== id);
      return route.fulfill({ status: 204, body: '' });
    }

    if (method === 'POST' && path === '/orders') {
      const { shippingAddress } = body<{ shippingAddress: ShippingAddress }>();
      return this.json(route, { order: this.placeOrder(shippingAddress) }, 201);
    }

    if (method === 'GET' && path === '/orders') {
      const items = this.orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        totalCents: order.totalCents,
        currency: order.currency,
        placedAt: order.placedAt,
      }));
      return this.json(route, { items, page: 1, limit: 10, total: items.length, totalPages: 1 });
    }

    // payments are off in this environment, which the checkout page treats as a
    // deployment without stripe rather than a bug
    if (method === 'POST' && path.endsWith('/payment-intent')) {
      return this.fail(route, 404, 'NOT_FOUND', 'Payments are not configured');
    }

    return this.fail(route, 404, 'NOT_FOUND', `${method} ${path}`);
  }
}

export const CREDENTIALS = { email: USER.email, password: PASSWORD };

// auto, so every test gets the api whether or not it names the fixture. a spec that
// forgets it would talk to the preview server instead and fail somewhere confusing.
export const test = base.extend<{ api: FakeApi }>({
  api: [
    async ({ page }, use) => {
      const api = new FakeApi();
      await api.install(page);
      await use(api);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
