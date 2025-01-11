import { z } from 'zod';

// an uncapped page size is a way to ask for the whole catalog in one request
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 60;

// everything in a query string is a string, ?limit=20 is "20". unknown keys are
// rejected, because a misspelled filter that's dropped looks like one that matched
// everything.
export const listProductsQuerySchema = z
  .object({
    page: z.coerce
      .number({ invalid_type_error: 'page must be a number' })
      .int('page must be a whole number')
      .min(1, 'page starts at 1')
      .default(1),
    limit: z.coerce
      .number({ invalid_type_error: 'limit must be a number' })
      .int('limit must be a whole number')
      .min(1, 'limit must be at least 1')
      .max(MAX_PAGE_SIZE, `limit must be at most ${String(MAX_PAGE_SIZE)}`)
      .default(DEFAULT_PAGE_SIZE),
  })
  .strict();

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
