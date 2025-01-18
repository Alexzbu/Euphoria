import { Router } from 'express';
import {
  createProductHandler,
  deleteProductHandler,
  updateProductHandler,
} from '../controllers/adminProductController.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { uploadImages } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { createProductSchema, updateProductSchema } from '../schemas/adminProduct.js';
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
