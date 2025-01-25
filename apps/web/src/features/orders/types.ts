import type { Order, OrderStatus, OrderSummary, Page } from '../../api/types';

export type { Order, OrderStatus, OrderSummary };
export type OrderPage = Page<OrderSummary>;

// what a status means to someone reading it, and how loudly to say it
export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  FULFILLED: 'Shipped',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const CANCELLABLE: OrderStatus[] = ['PENDING_PAYMENT'];
