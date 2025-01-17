import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

// an order records what was agreed, not what things cost now. every line carries its
// own copy of the name, colour, size, sku and price, because reading those back
// through the catalog would mean a price change in march silently rewrites what
// someone paid in january. the variant ref stays for stock and fulfilment.

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'FULFILLED',
  'CANCELLED',
  'REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// as data, not a chain of ifs spread across everything that changes a status. the
// illegal moves are then as visible as the legal ones.
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['FULFILLED', 'REFUNDED', 'CANCELLED'],
  FULFILLED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean =>
  ORDER_TRANSITIONS[from].includes(to);

export interface OrderItem {
  _id: Types.ObjectId;
  variant: Types.ObjectId;
  product: Types.ObjectId;
  productName: string;
  productSlug: string;
  sku: string;
  colorName: string;
  sizeName: string;
  image?: string;
  // what one of these cost at the time. never recomputed.
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  user: Types.ObjectId;
  // short and human-quotable, what a customer reads out on the phone
  orderNumber: string;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<Order>;

// money is only ever a whole number of minor units, on every field holding it
const wholeCents = {
  type: Number,
  required: true,
  min: [0, 'Amounts cannot be negative'] as [number, string],
  validate: {
    validator: (value: number) => Number.isInteger(value),
    message: 'Amounts are whole cents',
  },
};

const orderItemSchema = new Schema<OrderItem>(
  {
    variant: { type: Schema.Types.ObjectId, ref: 'Variant', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true },
    productSlug: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    colorName: { type: String, required: true, trim: true },
    sizeName: { type: String, required: true, trim: true },
    image: { type: String },
    unitPriceCents: wholeCents,
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
    },
    lineTotalCents: wholeCents,
  },
  { _id: true },
);

const shippingAddressSchema = new Schema<ShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 60 },
  },
  { _id: false },
);

const orderSchema = new Schema<Order>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: OrderItem[]) => items.length > 0,
        message: 'An order must contain at least one item',
      },
    },
    subtotalCents: wholeCents,
    shippingCents: wholeCents,
    totalCents: wholeCents,
    currency: { type: String, required: true, lowercase: true, trim: true, default: 'usd' },
    status: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
      default: 'PENDING_PAYMENT',
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    placedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

// order history: one customer's orders, newest first
orderSchema.index({ user: 1, createdAt: -1 });

// admin goes the other way round, by state
orderSchema.index({ status: 1, createdAt: -1 });

export const Order: Model<Order> = model<Order>('Order', orderSchema);
