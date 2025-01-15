import { Router } from 'express';
import { createOrderHandler } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../schemas/order.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const orderRouter: Router = Router();

orderRouter.use(requireAuth);

orderRouter.post('/', validate({ body: createOrderSchema }), asyncHandler(createOrderHandler));
