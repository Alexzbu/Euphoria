import { Router } from 'express';
import { listAllTaxonomyHandler, listTaxonomyHandler } from '../controllers/taxonomyController.js';
import { validate } from '../middleware/validate.js';
import { taxonomyParamsSchema } from '../schemas/taxonomy.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const taxonomyRouter: Router = Router();

taxonomyRouter.get('/', asyncHandler(listAllTaxonomyHandler));

taxonomyRouter.get(
  '/:kind',
  validate({ params: taxonomyParamsSchema }),
  asyncHandler(listTaxonomyHandler),
);
