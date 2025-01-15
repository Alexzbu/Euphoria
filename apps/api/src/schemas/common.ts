import { z } from 'zod';

export const objectIdField = z
  .string()
  .regex(/^[0-9a-f]{24}$/i, 'Must be a 24-character hexadecimal id');

export const idParamsSchema = z.object({ id: objectIdField }).strict();

export type IdParams = z.infer<typeof idParamsSchema>;

// declared once and shared by every listing. a limit one endpoint caps and
// another doesn't is a page size the caller picks.
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 60;

export const paginationFields = {
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
};

export interface Pagination {
  page: number;
  limit: number;
}
