import type { Request, Response } from 'express';
import * as orderService from '../services/orderService.js';
import { validated } from '../middleware/validate.js';
import type { CreateOrderInput } from '../schemas/order.js';
import { unauthorized } from '../utils/AppError.js';

function customerId(req: Request): string {
  if (!req.auth) throw unauthorized('Authentication required');
  return req.auth.sub;
}

// 201, the order exists now and the body is the thing that was created
export async function createOrderHandler(req: Request, res: Response): Promise<void> {
  const input = validated<CreateOrderInput>(req, 'body');
  res.status(201).json({ order: await orderService.createOrder(customerId(req), input) });
}
