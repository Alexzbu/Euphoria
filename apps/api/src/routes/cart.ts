import { Router } from 'express';
import { addCartItemHandler, getCartHandler } from '../controllers/cartController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { addCartItemSchema } from '../schemas/cart.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cartRouter: Router = Router();

// every cart route is authenticated, because every cart belongs to someone. the
// guard goes on the router rather than being repeated per route, so a route added
// later can't be the one that forgets it.
cartRouter.use(requireAuth);

cartRouter.get('/', asyncHandler(getCartHandler));

cartRouter.post('/items', validate({ body: addCartItemSchema }), asyncHandler(addCartItemHandler));
