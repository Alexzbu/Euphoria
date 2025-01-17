import { Router } from 'express';
import {
  cancelOrderHandler,
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
  updateOrderStatusHandler,
} from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from '../schemas/order.js';
import { idParamsSchema } from '../schemas/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const orderRouter: Router = Router();

orderRouter.use(requireAuth);

orderRouter.post('/', validate({ body: createOrderSchema }), asyncHandler(createOrderHandler));

orderRouter.get('/', validate({ query: listOrdersQuerySchema }), asyncHandler(listOrdersHandler));

orderRouter.get('/:id', validate({ params: idParamsSchema }), asyncHandler(getOrderHandler));

// a customer cancelling their own order and an admin driving the state machine are
// different powers over the same document, so they're different routes, each
// carrying the guard that describes who may call it.
orderRouter.post(
  '/:id/cancel',
  validate({ params: idParamsSchema }),
  asyncHandler(cancelOrderHandler),
);

orderRouter.patch(
  '/:id/status',
  requireRole('ADMIN'),
  validate({ params: idParamsSchema, body: updateOrderStatusSchema }),
  asyncHandler(updateOrderStatusHandler),
);
