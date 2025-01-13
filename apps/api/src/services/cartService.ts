import type { Types } from 'mongoose';
import { Cart, MAX_CART_LINES, MAX_ITEM_QUANTITY } from '../models/Cart.js';
import { Variant } from '../models/Variant.js';
import type { AddCartItemInput } from '../schemas/cart.js';
import { toTaxonomyRef, type TaxonomyLean, type TaxonomyRef } from './taxonomyService.js';
import { conflict, notFound, type AppError } from '../utils/AppError.js';

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

interface BuyableVariant {
  _id: Types.ObjectId;
  stock: number;
}

// a variant that doesn't exist and one whose product has left the catalog get the
// same answer. neither can be bought, so the difference only matters to someone
// probing for which ids are real.
async function loadBuyableVariant(variantId: string): Promise<BuyableVariant> {
  const variant = await Variant.findById(variantId)
    .select('stock product')
    .populate<{ product: { isActive: boolean } | null }>({ path: 'product', select: 'isActive' })
    .lean();

  if (!variant?.product?.isActive) throw notFound('That item is not available');
  return variant;
}

// how many of one variant a cart may hold. never more than exists to sell.
const limitFor = (variant: BuyableVariant): number => Math.min(variant.stock, MAX_ITEM_QUANTITY);

// upserts the empty cart so the update below has something to match. two requests
// arriving together both try to insert and the unique index rejects the loser.
async function ensureCart(userId: string): Promise<void> {
  try {
    await Cart.updateOne(
      { user: userId },
      { $setOnInsert: { user: userId, items: [] } },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
}

const DUPLICATE_KEY = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === DUPLICATE_KEY
  );
}

async function explainRejectedLine(
  userId: string,
  variantId: string,
  limit: number,
): Promise<AppError> {
  const cart = await Cart.findOne({ user: userId })
    .select('items.variant')
    .lean<{ items: { variant: Types.ObjectId }[] } | null>();

  const alreadyHasLine = cart?.items.some((item) => item.variant.toString() === variantId) ?? false;

  return alreadyHasLine
    ? conflict(`A cart may hold at most ${String(limit)} of this item`)
    : conflict(`A cart may hold at most ${String(MAX_CART_LINES)} different items`);
}

// both conditions live in the filter rather than a prior read, so two requests for
// the same variant can't each decide the line doesn't exist yet and make two.
async function pushLine(
  userId: string,
  variantId: string,
  quantity: number,
  limit: number,
): Promise<void> {
  const pushed = await Cart.updateOne(
    {
      user: userId,
      'items.variant': { $ne: variantId },
      [`items.${String(MAX_CART_LINES - 1)}`]: { $exists: false },
    },
    { $push: { items: { variant: variantId, quantity, addedAt: new Date() } } },
  );

  if (pushed.matchedCount === 0) throw await explainRejectedLine(userId, variantId, limit);
}

export async function addItem(
  userId: string,
  { variantId, quantity }: AddCartItemInput,
): Promise<CartView> {
  const variant = await loadBuyableVariant(variantId);
  const limit = limitFor(variant);
  if (quantity > limit) throw conflict(`Only ${String(variant.stock)} left in stock`);

  await ensureCart(userId);

  // the quantity condition is part of the filter, so the increment either lands
  // inside the limit or doesn't happen. never a read that was true a moment ago.
  const bumped = await Cart.updateOne(
    {
      user: userId,
      items: { $elemMatch: { variant: variantId, quantity: { $lte: limit - quantity } } },
    },
    { $inc: { 'items.$.quantity': quantity } },
  );

  if (bumped.matchedCount === 0) await pushLine(userId, variantId, quantity, limit);

  return getCart(userId);
}

// the owner is part of the filter, so someone else's line just doesn't match and
// gets the same 404 as an id that never existed. answering differently would
// confirm the id was real.
async function findLine(userId: string, itemId: string): Promise<{ variant: Types.ObjectId }> {
  const cart = await Cart.findOne({ user: userId, 'items._id': itemId })
    .select({ items: { $elemMatch: { _id: itemId } } })
    .lean<{ items: { variant: Types.ObjectId }[] } | null>();

  const line = cart?.items[0];
  if (!line) throw notFound('That item is not in your cart');
  return line;
}

export async function updateItemQuantity(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<CartView> {
  const line = await findLine(userId, itemId);
  const variant = await loadBuyableVariant(line.variant.toString());

  if (quantity > limitFor(variant)) throw conflict(`Only ${String(variant.stock)} left in stock`);

  await Cart.updateOne(
    { user: userId, 'items._id': itemId },
    { $set: { 'items.$.quantity': quantity } },
  );

  return getCart(userId);
}
