import { Router } from 'express';
import {
  addCartItemHandler,
  getCartHandler,
  mergeCartHandler,
  removeCartItemHandler,
  updateCartItemHandler,
} from '../controllers/cartController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { addCartItemSchema, mergeCartSchema, updateCartItemSchema } from '../schemas/cart.js';
import { idParamsSchema } from '../schemas/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cartRouter: Router = Router();

// every cart route is authenticated, because every cart belongs to someone. the
// guard goes on the router rather than being repeated per route, so a route added
// later can't be the one that forgets it.
cartRouter.use(requireAuth);

cartRouter.get('/', asyncHandler(getCartHandler));

cartRouter.post('/items', validate({ body: addCartItemSchema }), asyncHandler(addCartItemHandler));

cartRouter.patch(
  '/items/:id',
  validate({ params: idParamsSchema, body: updateCartItemSchema }),
  asyncHandler(updateCartItemHandler),
);

cartRouter.delete(
  '/items/:id',
  validate({ params: idParamsSchema }),
  asyncHandler(removeCartItemHandler),
);

cartRouter.post('/merge', validate({ body: mergeCartSchema }), asyncHandler(mergeCartHandler));
