import { randomBytes } from 'node:crypto';
import type { Types } from 'mongoose';
import { Order, type OrderItem, type OrderStatus, type ShippingAddress } from '../models/Order.js';
import { Variant } from '../models/Variant.js';
import type { CreateOrderInput } from '../schemas/order.js';
import * as cartService from './cartService.js';
import type { CartLine } from './cartService.js';
import { conflict, notFound, unprocessable } from '../utils/AppError.js';

// one flat rate, free above a threshold. kept here so the rule has one home.
const SHIPPING_FLAT_CENTS = 499;
const FREE_SHIPPING_THRESHOLD_CENTS = 10_000;

const shippingFor = (subtotalCents: number): number =>
  subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;

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

export interface OrderView {
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

interface OrderRow {
  _id: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  shippingAddress: ShippingAddress;
  placedAt: Date;
}

function toOrderLine(item: OrderItem): OrderLine {
  return {
    id: item._id.toString(),
    variantId: item.variant.toString(),
    productId: item.product.toString(),
    productName: item.productName,
    productSlug: item.productSlug,
    sku: item.sku,
    colorName: item.colorName,
    sizeName: item.sizeName,
    image: item.image,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
    lineTotalCents: item.lineTotalCents,
  };
}

function toOrderView(row: OrderRow): OrderView {
  return {
    id: row._id.toString(),
    orderNumber: row.orderNumber,
    status: row.status,
    items: row.items.map(toOrderLine),
    subtotalCents: row.subtotalCents,
    shippingCents: row.shippingCents,
    totalCents: row.totalCents,
    currency: row.currency,
    shippingAddress: row.shippingAddress,
    placedAt: row.placedAt.toISOString(),
  };
}

// the owner is part of the filter, so another user's order id is indistinguishable
// from one that doesn't exist
async function loadOrderView(userId: string, orderId: string): Promise<OrderView> {
  const row = await Order.findOne({ _id: orderId, user: userId }).lean<OrderRow | null>();
  if (!row) throw notFound('Order not found');
  return toOrderView(row);
}

// readable, quotable, and unguessable enough that one order number doesn't reveal the next
function nextOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  return `EU-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

async function releaseStock(lines: CartLine[]): Promise<void> {
  for (const line of lines) {
    await Variant.updateOne({ _id: line.variantId }, { $inc: { stock: line.quantity } });
  }
}

// each decrement carries its own stock: { $gte: quantity }, so two checkouts racing
// for the last item can't both succeed, the loser matches nothing instead of driving
// stock negative. a transaction would say this more directly but needs a replica
// set, and compensating works on any deployment.
// TODO: revisit if we ever run on a replica set.
async function reserveStock(lines: CartLine[]): Promise<CartLine[]> {
  const reserved: CartLine[] = [];

  for (const line of lines) {
    const claimed = await Variant.updateOne(
      { _id: line.variantId, stock: { $gte: line.quantity } },
      { $inc: { stock: -line.quantity } },
    );

    if (claimed.matchedCount === 0) {
      await releaseStock(reserved);
      throw conflict(
        `${line.product.name} in ${line.size.name} is no longer available in that quantity`,
      );
    }

    reserved.push(line);
  }

  return reserved;
}

// ids stay strings here, mongoose casts them when the order is written
interface NewOrderItem extends Omit<OrderItem, '_id' | 'variant' | 'product'> {
  variant: string;
  product: string;
}

function toOrderItems(lines: CartLine[]): NewOrderItem[] {
  return lines.map((line) => ({
    variant: line.variantId,
    product: line.product.id,
    productName: line.product.name,
    productSlug: line.product.slug,
    sku: line.sku,
    colorName: line.color.name,
    sizeName: line.size.name,
    image: line.product.images[0],
    // copied from the cart view, which read them from the catalog a moment ago.
    // from here on they belong to the order and are never read back.
    unitPriceCents: line.unitPriceCents,
    quantity: line.quantity,
    lineTotalCents: line.lineTotalCents,
  }));
}

export async function createOrder(
  userId: string,
  { shippingAddress }: CreateOrderInput,
): Promise<OrderView> {
  const cart = await cartService.getCart(userId);
  if (cart.items.length === 0) throw unprocessable('Your cart is empty');

  const reserved = await reserveStock(cart.items);

  try {
    const shippingCents = shippingFor(cart.subtotalCents);
    const order = await Order.create({
      user: userId,
      orderNumber: nextOrderNumber(),
      items: toOrderItems(cart.items),
      subtotalCents: cart.subtotalCents,
      shippingCents,
      totalCents: cart.subtotalCents + shippingCents,
      shippingAddress,
      placedAt: new Date(),
    });

    // only after the order exists. emptying first would lose the cart if the write
    // below failed, leaving the customer with neither.
    await cartService.clear(userId);

    return loadOrderView(userId, order._id.toString());
  } catch (error) {
    await releaseStock(reserved);
    throw error;
  }
}
