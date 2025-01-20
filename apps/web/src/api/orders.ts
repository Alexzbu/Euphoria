import { request } from './client';
import type { Order, OrderSummary, Page, PaymentIntent, ShippingAddress } from './types';

export type OrderQuery = {
  page?: number;
  limit?: number;
};

export function listOrders(query: OrderQuery = {}): Promise<Page<OrderSummary>> {
  return request<Page<OrderSummary>>('/orders', { query });
}

export async function getOrder(id: string): Promise<Order> {
  const { order } = await request<{ order: Order }>(`/orders/${id}`);
  return order;
}

// no line items in the payload. the order is built from the cart the server
// already holds, so there's nothing here for a client to misreport.
export async function createOrder(shippingAddress: ShippingAddress): Promise<Order> {
  const { order } = await request<{ order: Order }>('/orders', {
    method: 'POST',
    body: { shippingAddress },
  });
  return order;
}

export async function cancelOrder(id: string): Promise<Order> {
  const { order } = await request<{ order: Order }>(`/orders/${id}/cancel`, { method: 'POST' });
  return order;
}

export function createPaymentIntent(id: string): Promise<PaymentIntent> {
  return request<PaymentIntent>(`/orders/${id}/payment-intent`, { method: 'POST' });
}
