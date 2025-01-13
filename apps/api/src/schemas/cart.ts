import { z } from 'zod';
import { MAX_ITEM_QUANTITY } from '../models/Cart.js';
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
