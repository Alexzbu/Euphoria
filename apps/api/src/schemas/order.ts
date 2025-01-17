import { z } from 'zod';
import { paginationFields } from './common.js';
import { ORDER_STATUSES } from '../models/Order.js';

const line = (max: number) => z.string().trim().min(1, 'Required').max(max, 'Too long');

export const shippingAddressSchema = z
  .object({
    fullName: line(120),
    line1: line(200),
    line2: z.string().trim().max(200, 'Too long').optional(),
    city: line(120),
    postalCode: line(20),
    country: line(60),
  })
  .strict();

export const createOrderSchema = z.object({ shippingAddress: shippingAddressSchema }).strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const listOrdersQuerySchema = z.object({ ...paginationFields }).strict();

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

// the target status only. which moves are legal from where is the state machine's
// business. this says where the caller wants to go, the service decides if it can.
export const updateOrderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) }).strict();

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
