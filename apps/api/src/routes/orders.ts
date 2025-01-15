import { Router } from 'express';
import {
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, listOrdersQuerySchema } from '../schemas/order.js';
import { idParamsSchema } from '../schemas/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const orderRouter: Router = Router();

orderRouter.use(requireAuth);

orderRouter.post('/', validate({ body: createOrderSchema }), asyncHandler(createOrderHandler));

orderRouter.get('/', validate({ query: listOrdersQuerySchema }), asyncHandler(listOrdersHandler));

orderRouter.get('/:id', validate({ params: idParamsSchema }), asyncHandler(getOrderHandler));
