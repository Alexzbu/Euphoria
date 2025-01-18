import { Router } from 'express';
import {
  createTaxonomyHandler,
  deleteTaxonomyHandler,
  updateTaxonomyHandler,
} from '../controllers/adminTaxonomyController.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  taxonomyBodySchema,
  taxonomyItemParamsSchema,
  taxonomyParamsSchema,
} from '../schemas/taxonomy.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminTaxonomyRouter: Router = Router();

adminTaxonomyRouter.use(requireAuth, requireRole('ADMIN'));

adminTaxonomyRouter.post(
  '/:kind',
  validate({ params: taxonomyParamsSchema, body: taxonomyBodySchema }),
  asyncHandler(createTaxonomyHandler),
);

adminTaxonomyRouter.patch(
  '/:kind/:id',
  validate({ params: taxonomyItemParamsSchema, body: taxonomyBodySchema }),
  asyncHandler(updateTaxonomyHandler),
);

adminTaxonomyRouter.delete(
  '/:kind/:id',
  validate({ params: taxonomyItemParamsSchema }),
  asyncHandler(deleteTaxonomyHandler),
);
