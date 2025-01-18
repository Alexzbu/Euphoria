import { Router } from 'express';
import {
  deleteVariantHandler,
  updateVariantHandler,
} from '../controllers/adminVariantController.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { updateVariantSchema } from '../schemas/adminVariant.js';
import { idParamsSchema } from '../schemas/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminVariantRouter: Router = Router();

adminVariantRouter.use(requireAuth, requireRole('ADMIN'));

adminVariantRouter.patch(
  '/:id',
  validate({ params: idParamsSchema, body: updateVariantSchema }),
  asyncHandler(updateVariantHandler),
);

adminVariantRouter.delete(
  '/:id',
  validate({ params: idParamsSchema }),
  asyncHandler(deleteVariantHandler),
);
