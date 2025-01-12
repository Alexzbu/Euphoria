import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

/** at most this many of one variant on a single line */
export const MAX_ITEM_QUANTITY = 99;

/** and this many distinct lines per cart. both enforced in the database. */
export const MAX_CART_LINES = 50;

export interface CartItem {
  _id: Types.ObjectId;
  // points at a Variant, never a Product. "one classic tee" isn't something you
  // can pick, pack, or take out of stock.
  variant: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  user: Types.ObjectId;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type CartDocument = HydratedDocument<Cart>;

const cartItemSchema = new Schema<CartItem>(
  {
    variant: { type: Schema.Types.ObjectId, ref: 'Variant', required: true },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [MAX_ITEM_QUANTITY, `Quantity must be at most ${String(MAX_ITEM_QUANTITY)}`],
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const cartSchema = new Schema<Cart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: (items: CartItem[]) => items.length <= MAX_CART_LINES,
        message: `A cart holds at most ${String(MAX_CART_LINES)} lines`,
      },
    },
  },
  { timestamps: true },
);

// prices aren't copied onto a line. a cart shows what things cost now, so storing
// it here would just make a second copy to keep in step. the copy that must never
// move is the one taken when an order is placed, and that belongs to the order.

export const Cart: Model<Cart> = model<Cart>('Cart', cartSchema);
