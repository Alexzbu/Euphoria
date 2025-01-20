import { request } from './client';
import type { Cart } from './types';

export interface CartItemInput {
  variantId: string;
  quantity: number;
}

export function getCart(): Promise<Cart> {
  return request<Cart>('/cart');
}

export function addCartItem(input: CartItemInput): Promise<Cart> {
  return request<Cart>('/cart/items', { method: 'POST', body: input });
}

export function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return request<Cart>(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } });
}

export function removeCartItem(itemId: string): Promise<void> {
  return request<void>(`/cart/items/${itemId}`, { method: 'DELETE' });
}

// what a guest collected before signing in. the server decides what survives the
// merge, since stock and prices may have moved on since.
export function mergeCart(items: CartItemInput[]): Promise<Cart> {
  return request<Cart>('/cart/merge', { method: 'POST', body: { items } });
}
