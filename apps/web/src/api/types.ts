// The shapes the api actually answers with. Money is always integer cents and
// dates are always ISO strings, both because that's what crosses the wire.

export type RoleName = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  role: RoleName;
}

export interface Session {
  accessToken: string;
  user: User;
}

export interface TaxonomyRef {
  id: string;
  name: string;
  slug: string;
}

export type TaxonomyKind = 'brands' | 'colors' | 'sizes' | 'categories' | 'sexes';

export type TaxonomyMap = Record<TaxonomyKind, TaxonomyRef[]>;

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  images: string[];
  brand: TaxonomyRef;
  category: TaxonomyRef;
  sex: TaxonomyRef;
  createdAt: string;
}

export interface VariantOption {
  id: string;
  sku: string;
  stock: number;
  inStock: boolean;
  color: TaxonomyRef;
  size: TaxonomyRef;
}

export interface ProductDetail extends ProductSummary {
  variants: VariantOption[];
}

// what admin reads answer with: the shopper's view plus the fields only an
// operator has any use for
export interface AdminProduct extends ProductSummary {
  isActive: boolean;
  updatedAt: string;
}

export interface AdminVariant extends VariantOption {
  productId: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CartLine {
  id: string;
  variantId: string;
  sku: string;
  quantity: number;
  stock: number;
  unitPriceCents: number;
  lineTotalCents: number;
  product: { id: string; name: string; slug: string; images: string[] };
  color: TaxonomyRef;
  size: TaxonomyRef;
}

export interface Cart {
  items: CartLine[];
  totalItems: number;
  subtotalCents: number;
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'REFUNDED';

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderLine {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  colorName: string;
  sizeName: string;
  image?: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  shippingAddress: ShippingAddress;
  placedAt: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalItems: number;
  totalCents: number;
  currency: string;
  placedAt: string;
}

export interface PaymentIntent {
  clientSecret: string;
  amountCents: number;
  currency: string;
}
