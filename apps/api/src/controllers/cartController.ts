import type { Request, Response } from 'express';
import * as cartService from '../services/cartService.js';
import { validated } from '../middleware/validate.js';
import type { AddCartItemInput, MergeCartInput, UpdateCartItemInput } from '../schemas/cart.js';
import type { IdParams } from '../schemas/common.js';
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

export async function updateCartItemHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  const { quantity } = validated<UpdateCartItemInput>(req, 'body');
  res.json(await cartService.updateItemQuantity(ownerId(req), id, quantity));
}

// 204 and no body, the line is gone. whoever needs the new totals refetches the cart.
export async function removeCartItemHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  await cartService.removeItem(ownerId(req), id);
  res.status(204).send();
}

export async function mergeCartHandler(req: Request, res: Response): Promise<void> {
  const { items } = validated<MergeCartInput>(req, 'body');
  res.json(await cartService.mergeGuestCart(ownerId(req), items));
}
