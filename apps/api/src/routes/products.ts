import { Router } from 'express';
import { getProductHandler, listProductsHandler } from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import { idParamsSchema } from '../schemas/common.js';
import { listProductsQuerySchema } from '../schemas/product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const productRouter: Router = Router();

productRouter.get(
  '/',
  validate({ query: listProductsQuerySchema }),
  asyncHandler(listProductsHandler),
);

productRouter.get('/:id', validate({ params: idParamsSchema }), asyncHandler(getProductHandler));
