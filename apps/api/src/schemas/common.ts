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

// a flag that survives a trip through a form. multipart and urlencoded bodies
// have no types, so a checkbox arrives as "false" and every non-empty string is
// truthy, meaning loose coercion reads "off" as on. map the two literals, and take
// a real boolean from a json client as-is.
export const formBoolean = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');

// may arrive once or several times under the same name. multipart and query
// strings both express a list that way, and a caller sending one value shouldn't
// have to know it's building a list.
export const repeatable = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((value) => (Array.isArray(value) ? value : [value]), z.array(item));
