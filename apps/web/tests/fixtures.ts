import type {
  Cart,
  CartLine,
  Order,
  OrderSummary,
  Page,
  ProductDetail,
  ProductSummary,
  TaxonomyMap,
  TaxonomyRef,
  User,
  VariantOption,
} from '../src/api/types';

const ref = (name: string, slug = name.toLowerCase()): TaxonomyRef => ({
  id: `t-${slug}`,
  name,
  slug,
});

// named one by one so a fixture can say `BLACK` instead of `COLORS[0]`, which
// under noUncheckedIndexedAccess is possibly-undefined at every use site
export const NIKE = ref('Nike');
export const ADIDAS = ref('Adidas');
export const TOPS = ref('Tops');
export const TROUSERS = ref('Trousers');
export const BLACK = ref('Black');
export const BEIGE = ref('Beige');
export const SMALL = ref('S', 's');
export const MEDIUM = ref('M', 'm');
export const LARGE = ref('L', 'l');
export const WOMEN = ref('Women');
export const MEN = ref('Men');

export const BRANDS = [NIKE, ADIDAS];
export const CATEGORIES = [TOPS, TROUSERS];
export const COLORS = [BLACK, BEIGE];
export const SIZES = [SMALL, MEDIUM, LARGE];
export const SEXES = [WOMEN, MEN];

export const taxonomy: TaxonomyMap = {
  brands: BRANDS,
  categories: CATEGORIES,
  colors: COLORS,
  sizes: SIZES,
  sexes: SEXES,
};

export function makeProduct(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: 'p-1',
    name: 'Ribbed Tee',
    slug: 'ribbed-tee',
    description: 'A tee.',
    priceCents: 4_500,
    images: ['/media/tee.jpg'],
    brand: NIKE,
    category: TOPS,
    sex: WOMEN,
    createdAt: '2025-01-10T09:00:00.000Z',
    ...overrides,
  };
}

export function makeVariant(overrides: Partial<VariantOption> = {}): VariantOption {
  return {
    id: 'v-1',
    sku: 'TEE-BLK-M',
    stock: 4,
    inStock: true,
    color: BLACK,
    size: MEDIUM,
    ...overrides,
  };
}

export function makeProductDetail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return { ...makeProduct(), variants: [makeVariant()], ...overrides };
}

export function makePage<T>(items: T[], overrides: Partial<Page<T>> = {}): Page<T> {
  return {
    items,
    page: 1,
    limit: 12,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / 12)),
    ...overrides,
  };
}

export function makeCartLine(overrides: Partial<CartLine> = {}): CartLine {
  const quantity = overrides.quantity ?? 2;
  const unitPriceCents = overrides.unitPriceCents ?? 4_500;

  return {
    id: 'c-1',
    variantId: 'v-1',
    sku: 'TEE-BLK-M',
    stock: 4,
    unitPriceCents,
    quantity,
    lineTotalCents: unitPriceCents * quantity,
    product: { id: 'p-1', name: 'Ribbed Tee', slug: 'ribbed-tee', images: ['/media/tee.jpg'] },
    color: BLACK,
    size: MEDIUM,
    ...overrides,
  };
}

export function makeCart(lines: CartLine[] = []): Cart {
  return {
    items: lines,
    totalItems: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
  };
}

export const customer: User = { id: 'u-1', email: 'ada@example.com', role: 'CUSTOMER' };
export const admin: User = { id: 'u-2', email: 'root@example.com', role: 'ADMIN' };

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o-1',
    orderNumber: 'EU-2501-0001',
    status: 'PENDING_PAYMENT',
    items: [
      {
        id: 'ol-1',
        variantId: 'v-1',
        productId: 'p-1',
        productName: 'Ribbed Tee',
        productSlug: 'ribbed-tee',
        sku: 'TEE-BLK-M',
        colorName: 'Black',
        sizeName: 'M',
        image: '/media/tee.jpg',
        unitPriceCents: 4_500,
        quantity: 2,
        lineTotalCents: 9_000,
      },
    ],
    subtotalCents: 9_000,
    shippingCents: 0,
    totalCents: 9_000,
    currency: 'USD',
    shippingAddress: {
      fullName: 'Ada Lovelace',
      line1: '12 Analytical Way',
      city: 'London',
      postalCode: 'W1 1AA',
      country: 'GB',
    },
    placedAt: '2025-01-20T12:00:00.000Z',
    ...overrides,
  };
}

export function toOrderSummary(order: Order): OrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
    totalCents: order.totalCents,
    currency: order.currency,
    placedAt: order.placedAt,
  };
}
