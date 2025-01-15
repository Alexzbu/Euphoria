import { z } from 'zod';
import { paginationFields } from './common.js';

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
