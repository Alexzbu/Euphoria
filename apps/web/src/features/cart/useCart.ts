import { useMemo, useSyncExternalStore } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { addCartItem, getCart } from '../../api/cart';
import { useAuth } from '../auth/useAuth';
import {
  addGuestLine,
  getEmptyGuestCart,
  getGuestCart,
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
