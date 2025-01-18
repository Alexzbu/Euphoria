import { z } from 'zod';
import { TAXONOMY_PATH_NAMES } from '../services/taxonomyService.js';
import { objectIdField } from './common.js';

export const taxonomyParamsSchema = z.object({ kind: z.enum(TAXONOMY_PATH_NAMES) }).strict();

export type TaxonomyParams = z.infer<typeof taxonomyParamsSchema>;

export const taxonomyItemParamsSchema = z
  .object({ kind: z.enum(TAXONOMY_PATH_NAMES), id: objectIdField })
  .strict();

export type TaxonomyItemParams = z.infer<typeof taxonomyItemParamsSchema>;

// only the name is ever supplied, the slug is derived. letting a caller set both
// independently is how a brand ends up named "Nike" at the slug adidas: one value
// shown to shoppers, another in every url.
const nameField = z
  .string()
  .trim()
  .min(1, 'Name must not be empty')
  .max(40, 'Name must be at most 40 characters');

export const taxonomyBodySchema = z.object({ name: nameField }).strict();

export type TaxonomyBody = z.infer<typeof taxonomyBodySchema>;
