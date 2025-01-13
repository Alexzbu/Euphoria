import type { Request, Response } from 'express';
import * as cartService from '../services/cartService.js';
import { validated } from '../middleware/validate.js';
import type { AddCartItemInput } from '../schemas/cart.js';
import { unauthorized } from '../utils/AppError.js';

// the owner of the cart, taken from the verified token and from nowhere else.
//
// this is the whole of the access rule. a user id arriving in a body, a query
// string or a path is a claim the caller made about themselves, not a fact, and a
// claim is an input to check rather than a value to look up with. reading it here
// once means no handler below can accidentally trust one.
function ownerId(req: Request): string {
  if (!req.auth) throw unauthorized('Authentication required');
  return req.auth.sub;
}

export async function getCartHandler(req: Request, res: Response): Promise<void> {
  res.json(await cartService.getCart(ownerId(req)));
}

export async function addCartItemHandler(req: Request, res: Response): Promise<void> {
  const input = validated<AddCartItemInput>(req, 'body');
  res.json(await cartService.addItem(ownerId(req), input));
}
