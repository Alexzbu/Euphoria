import { Router } from 'express';
import {
  createProductHandler,
  deleteProductHandler,
  updateProductHandler,
} from '../controllers/adminProductController.js';
import {
  createVariantHandler,
  listVariantsHandler,
} from '../controllers/adminVariantController.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { uploadImages } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { createProductSchema, updateProductSchema } from '../schemas/adminProduct.js';
import { createVariantSchema } from '../schemas/adminVariant.js';
import { idParamsSchema } from '../schemas/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminProductRouter: Router = Router();

adminProductRouter.use(requireAuth, requireRole('ADMIN'));

// the upload parser runs ahead of the validation, and has to: a multipart request
// has no readable body until it's been parsed, so validating first would check an
// empty object and let everything through.
adminProductRouter.post(
  '/',
  uploadImages,
  validate({ body: createProductSchema }),
  asyncHandler(createProductHandler),
);

adminProductRouter.patch(
  '/:id',
  uploadImages,
  validate({ params: idParamsSchema, body: updateProductSchema }),
  asyncHandler(updateProductHandler),
);

adminProductRouter.delete(
  '/:id',
  validate({ params: idParamsSchema }),
  asyncHandler(deleteProductHandler),
);

// a product's variants, nested under the product they belong to. the shopper-facing
// detail endpoint answers the same question, but only for a product that's on sale.
// this one also answers for a deactivated one, which is the state anything being
// edited tends to be in.
adminProductRouter.get(
  '/:id/variants',
  validate({ params: idParamsSchema }),
  asyncHandler(listVariantsHandler),
);

adminProductRouter.post(
  '/:id/variants',
  validate({ params: idParamsSchema, body: createVariantSchema }),
  asyncHandler(createVariantHandler),
);
