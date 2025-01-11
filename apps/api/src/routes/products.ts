import { Router } from 'express';
import { listProductsHandler } from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import { listProductsQuerySchema } from '../schemas/product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const productRouter: Router = Router();

productRouter.get(
  '/',
  validate({ query: listProductsQuerySchema }),
  asyncHandler(listProductsHandler),
);
