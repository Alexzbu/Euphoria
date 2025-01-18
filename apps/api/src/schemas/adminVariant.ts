import { z } from 'zod';
import { objectIdField } from './common.js';

const MAX_STOCK = 1_000_000;

const stockField = z.coerce
  .number({ invalid_type_error: 'Stock is a whole number of units' })
  .int('Stock is a whole number of units')
  .min(0, 'Stock cannot be negative')
  .max(MAX_STOCK, 'Stock is implausibly high');

// characters that survive being printed on a label, scanned, and put in a url.
// the model upper-cases it, so a-1 and A-1 are one sku as far as the unique
// index is concerned.
const skuField = z
  .string()
  .trim()
  .min(1, 'SKU must not be empty')
  .max(40, 'SKU must be at most 40 characters')
  .regex(/^[A-Za-z0-9._-]+$/, 'SKU may contain letters, digits, dots, dashes and underscores');

export const createVariantSchema = z
  .object({
    color: objectIdField,
    size: objectIdField,
    // derived from the product and this combination when left out
    sku: skuField.optional(),
    stock: stockField.default(0),
  })
  .strict();

export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const updateVariantSchema = z
  .object({
    color: objectIdField.optional(),
    size: objectIdField.optional(),
    sku: skuField.optional(),
    stock: stockField.optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Provide at least one field to update',
  });

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
