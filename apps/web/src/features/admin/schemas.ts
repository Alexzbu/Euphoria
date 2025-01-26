import { z } from 'zod';

// The same limits the api enforces. Repeated here so a mistake shows up under the
// field that caused it instead of as a rejected request.

export const MAX_IMAGES = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PRICE_CENTS = 10_000_000;

const objectId = z.string().regex(/^[0-9a-f]{24}$/i, 'Choose an option');

export const productSchema = z.object({
  name: z.string().trim().min(2, 'At least 2 characters').max(120, 'At most 120 characters'),
  description: z.string().trim().max(5000, 'At most 5000 characters'),
  // typed in currency, sent in cents. an operator writing 129.99 shouldn't have to
  // think in minor units, and 12999 typed by hand is a coat priced at £129.99 or
  // £12,999 depending on who typed it.
  priceCents: z
    .number({ invalid_type_error: 'Enter a price' })
    .int('Prices go to two decimal places')
    .min(1, 'Enter a price')
    .max(MAX_PRICE_CENTS, 'That price looks implausible'),
  brand: objectId,
  category: objectId,
  sex: objectId,
});

export type ProductValues = z.infer<typeof productSchema>;

export const variantSchema = z.object({
  color: objectId,
  size: objectId,
  sku: z
    .string()
    .trim()
    .max(40, 'At most 40 characters')
    .regex(/^[A-Za-z0-9._-]*$/, 'Letters, digits, dots, dashes and underscores')
    .optional(),
  stock: z
    .number({ invalid_type_error: 'Enter a number' })
    .int('Whole units only')
    .min(0, 'Cannot be negative'),
});

export type VariantValues = z.infer<typeof variantSchema>;

export const dollarsToCents = (value: string): number => Math.round(Number(value) * 100);
export const centsToDollars = (cents: number): string => (cents / 100).toFixed(2);
