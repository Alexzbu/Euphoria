import { z } from 'zod';
import { MAX_CART_LINES, MAX_ITEM_QUANTITY } from '../models/Cart.js';
import { objectIdField } from './common.js';

const quantityField = z
  .number({ invalid_type_error: 'quantity must be a number' })
  .int('quantity must be a whole number')
  .min(1, 'quantity must be at least 1')
  .max(MAX_ITEM_QUANTITY, `quantity must be at most ${String(MAX_ITEM_QUANTITY)}`);

export const addCartItemSchema = z
  .object({
    variantId: objectIdField,
    quantity: quantityField.default(1),
  })
  .strict();

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

// no default and no zero. an update has to say what it wants, and emptying a line
// is a removal, which has its own verb and its own status code.
export const updateCartItemSchema = z.object({ quantity: quantityField }).strict();

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// the cart someone built before signing in. an empty list is fine and does
// nothing, so the client can just send whatever it has.
export const mergeCartSchema = z
  .object({
    items: z
      .array(z.object({ variantId: objectIdField, quantity: quantityField }).strict())
      .max(MAX_CART_LINES, `A cart holds at most ${String(MAX_CART_LINES)} different items`),
  })
  .strict();

export type MergeCartInput = z.infer<typeof mergeCartSchema>;
export type MergeCartItem = MergeCartInput['items'][number];
