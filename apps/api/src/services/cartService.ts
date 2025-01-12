import type { Types } from 'mongoose';
import { Cart } from '../models/Cart.js';
import { toTaxonomyRef, type TaxonomyLean, type TaxonomyRef } from './taxonomyService.js';

// every function here takes the owner's id first, and it comes from the verified
// access token. nothing takes a cart id, so a lookup is always { user: <caller> }
// and a request aimed at someone else's cart finds nothing.

interface ProductLean {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  images: string[];
  priceCents: number;
  isActive: boolean;
}

interface VariantLean {
  _id: Types.ObjectId;
  sku: string;
  stock: number;
  color: TaxonomyLean;
  size: TaxonomyLean;
  product: ProductLean | null;
}

interface CartRow {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: {
    _id: Types.ObjectId;
    variant: VariantLean | null;
    quantity: number;
    addedAt: Date;
  }[];
}

export interface CartLine {
  // the id a PATCH or DELETE targets. meaningless outside its own cart.
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

export interface CartView {
  items: CartLine[];
  totalItems: number;
  subtotalCents: number;
}

const LINE_POPULATE = {
  path: 'items.variant',
  select: 'sku stock color size product',
  populate: [
    { path: 'color', select: 'name slug' },
    { path: 'size', select: 'name slug' },
    { path: 'product', select: 'name slug images priceCents isActive' },
  ],
};

const EMPTY_CART: CartView = { items: [], totalItems: 0, subtotalCents: 0 };

function toLine(item: CartRow['items'][number], variant: VariantLean): CartLine | null {
  const product = variant.product;
  // a line whose product has left the catalog can't be bought, so don't offer it
  if (!product?.isActive) return null;

  return {
    id: item._id.toString(),
    variantId: variant._id.toString(),
    sku: variant.sku,
    quantity: item.quantity,
    stock: variant.stock,
    unitPriceCents: product.priceCents,
    // integer cents throughout, a total built from floats drifts by a cent
    lineTotalCents: product.priceCents * item.quantity,
    product: {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      images: product.images,
    },
    color: toTaxonomyRef(variant.color),
    size: toTaxonomyRef(variant.size),
  };
}

function toView(row: CartRow | null): CartView {
  if (!row) return EMPTY_CART;

  const items = row.items
    .map((item) => (item.variant ? toLine(item, item.variant) : null))
    .filter((line): line is CartLine => line !== null);

  return {
    items,
    totalItems: items.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: items.reduce((sum, line) => sum + line.lineTotalCents, 0),
  };
}

async function loadCart(userId: string): Promise<CartRow | null> {
  return Cart.findOne({ user: userId }).populate(LINE_POPULATE).lean<CartRow | null>();
}

// someone who never added anything has an empty cart, not a missing one. creating
// a document on a GET means every visit from a signed-in browser leaves one behind.
export async function getCart(userId: string): Promise<CartView> {
  return toView(await loadCart(userId));
}
