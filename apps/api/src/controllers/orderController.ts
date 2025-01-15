import type { Request, Response } from 'express';
import * as orderService from '../services/orderService.js';
import { validated } from '../middleware/validate.js';
import type { CreateOrderInput, ListOrdersQuery } from '../schemas/order.js';
import type { IdParams } from '../schemas/common.js';
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

export async function listOrdersHandler(req: Request, res: Response): Promise<void> {
  const query = validated<ListOrdersQuery>(req, 'query');
  res.json(await orderService.listOrders(customerId(req), query));
}

export async function getOrderHandler(req: Request, res: Response): Promise<void> {
  const { id } = validated<IdParams>(req, 'params');
  res.json({ order: await orderService.getOrder(customerId(req), id) });
}
