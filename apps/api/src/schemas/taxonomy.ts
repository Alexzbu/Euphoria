import { z } from 'zod';
import { TAXONOMY_PATH_NAMES } from '../services/taxonomyService.js';

export const taxonomyParamsSchema = z.object({ kind: z.enum(TAXONOMY_PATH_NAMES) }).strict();

export type TaxonomyParams = z.infer<typeof taxonomyParamsSchema>;
