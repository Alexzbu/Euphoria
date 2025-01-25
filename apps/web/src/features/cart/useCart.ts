import { useMemo, useSyncExternalStore } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { addCartItem, getCart, mergeCart, removeCartItem, updateCartItem } from '../../api/cart';
import { useAuth } from '../auth/useAuth';
import {
  addGuestLine,
  clearGuestCart,
  getEmptyGuestCart,
  getGuestCart,
  removeGuestLine,
  setGuestQuantity,
  subscribeGuestCart,
  toCartView,
  type GuestCartLine,
} from './guestCart';
import type { Cart } from '../../api/types';

export const cartKeys = { cart: ['cart'] as const };

const EMPTY_CART: Cart = { items: [], totalItems: 0, subtotalCents: 0 };

interface CartState {
  cart: Cart;
  isPending: boolean;
  isGuest: boolean;
}

// One cart, two backing stores. Signed in it lives on the server; before that it
// lives in this browser. Both come back in the same shape so nothing downstream
// has to care which one it got.
export function useCart(): CartState {
  const { status } = useAuth();
  const isGuest = status !== 'authenticated';

  const guestLines = useSyncExternalStore(subscribeGuestCart, getGuestCart, getEmptyGuestCart);
  const guestCart = useMemo(() => toCartView(guestLines), [guestLines]);

  const { data, isPending } = useQuery({
    queryKey: cartKeys.cart,
    queryFn: getCart,
    enabled: status === 'authenticated',
  });

  if (isGuest) return { cart: guestCart, isPending: false, isGuest };

  return { cart: data ?? EMPTY_CART, isPending, isGuest };
}

export interface AddToCartInput {
  quantity: number;
  line: Omit<GuestCartLine, 'quantity'>;
}

export function useAddToCart(): UseMutationResult<void, Error, AddToCartInput> {
  const { status } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quantity, line }: AddToCartInput) => {
      if (status !== 'authenticated') {
        addGuestLine({ ...line, quantity });
        return;
      }

      const cart = await addCartItem({ variantId: line.variantId, quantity });
      queryClient.setQueryData(cartKeys.cart, cart);
    },
  });
}

interface QuantityInput {
  itemId: string;
  quantity: number;
}

export function useUpdateCartQuantity(): UseMutationResult<void, Error, QuantityInput> {
  const { status } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, quantity }: QuantityInput) => {
      if (status !== 'authenticated') {
        // a guest line is keyed by its variant, and that's what the cart view
        // hands back as the line id
        setGuestQuantity(itemId, quantity);
        return;
      }

      const cart = await updateCartItem(itemId, quantity);
      queryClient.setQueryData(cartKeys.cart, cart);
    },
  });
}

export function useRemoveCartItem(): UseMutationResult<void, Error, string> {
  const { status } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (status !== 'authenticated') {
        removeGuestLine(itemId);
        return;
      }

      await removeCartItem(itemId);
      await queryClient.invalidateQueries({ queryKey: cartKeys.cart });
    },
  });
}

// Signing in is the moment the browser's cart stops being the cart. The server
// decides what survives: prices and stock may have moved since a line was added,
// and it re-reads both. Local storage is cleared either way, so a failed merge
// can't replay on the next render.
export function useGuestCartMerge(): void {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const merge = useMutation({
    mutationFn: async (lines: GuestCartLine[]) => {
      const cart = await mergeCart(
        lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
      );
      queryClient.setQueryData(cartKeys.cart, cart);
    },
  });

  const { mutate, isPending, isIdle } = merge;

  useEffect(() => {
    if (status !== 'authenticated' || isPending || !isIdle) return;

    const lines = getGuestCart();
    if (lines.length === 0) return;

    clearGuestCart();
    mutate(lines);
  }, [status, mutate, isPending, isIdle]);
}
