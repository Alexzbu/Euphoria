import { z } from 'zod';
import { paginationFields } from './common.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MAX_FILTER_VALUES = 20;

// a repeated filter arrives comma-separated (?brand=nike,adidas), which reads the
// same in a url bar as it does in a link. bounded, since each value becomes a term
// in a database query.
const slugList = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  )
  .pipe(
    z
      .array(z.string().regex(SLUG_PATTERN, 'Filter values must be slugs, like "t-shirts"'))
      .min(1, 'Provide at least one value')
      .max(MAX_FILTER_VALUES, `Provide at most ${String(MAX_FILTER_VALUES)} values`),
  )
  .transform((values) => [...new Set(values)]);

export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 80;

// stored and filtered in minor units, so a bound is a whole number of cents
const priceBound = z.coerce
  .number({ invalid_type_error: 'Price bounds are given in cents' })
  .int('Price bounds are whole cents')
  .min(0, 'Price bounds cannot be negative');

// everything in a query string is a string, ?limit=20 is "20". unknown keys are
// rejected, because a misspelled filter that's dropped looks like one that matched
// everything.
export const listProductsQuerySchema = z
  .object({
    ...paginationFields,

    brand: slugList.optional(),
    category: slugList.optional(),
    sex: slugList.optional(),
    color: slugList.optional(),
    size: slugList.optional(),

    // neither defaulted. a default ceiling would hide every product above it from a
    // listing nobody filtered, and the catalog would just appear to stop there.
    priceMin: priceBound.optional(),
    priceMax: priceBound.optional(),

    // bounded because the term reaches the database as a pattern. a one-character
    // search matches most of the catalog.
    search: z
      .string()
      .trim()
      .min(MIN_SEARCH_LENGTH, `Search for at least ${String(MIN_SEARCH_LENGTH)} characters`)
      .max(MAX_SEARCH_LENGTH, `Search for at most ${String(MAX_SEARCH_LENGTH)} characters`)
      .optional(),
  })
  .strict()
  .refine(
    (query) =>
      query.priceMin === undefined ||
      query.priceMax === undefined ||
      query.priceMin <= query.priceMax,
    { message: 'priceMin cannot exceed priceMax', path: ['priceMin'] },
  );

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
