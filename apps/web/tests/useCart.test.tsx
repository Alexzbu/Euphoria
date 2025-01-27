import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { API_URL } from '../src/config/env';
import {
  useAddToCart,
  useCart,
  useGuestCartMerge,
  useRemoveCartItem,
  useUpdateCartQuantity,
} from '../src/features/cart/useCart';
import { getGuestCart } from '../src/features/cart/guestCart';
import { customer, makeCart, makeCartLine } from './fixtures';
import { signedInAs } from './msw/handlers';
import { server } from './msw/server';
import { createWrapper } from './render';
import type { CartItemInput } from '../src/api/cart';

const line = {
  variantId: 'v-1',
  sku: 'TEE-BLK-M',
  stock: 3,
  unitPriceCents: 4_500,
  productId: 'p-1',
  productName: 'Ribbed Tee',
  colorName: 'Black',
  sizeName: 'M',
};

function mountCart() {
  return renderHook(
    () => ({
      cart: useCart(),
      add: useAddToCart(),
      update: useUpdateCartQuantity(),
      remove: useRemoveCartItem(),
    }),
    { wrapper: createWrapper() },
  );
}

describe('useCart as a guest', () => {
  it('keeps the cart in this browser and totals it the same way the api does', async () => {
    const { result } = mountCart();

    await act(async () => {
      await result.current.add.mutateAsync({ quantity: 2, line });
    });

    await waitFor(() => {
      expect(result.current.cart.cart.totalItems).toBe(2);
    });
    expect(result.current.cart.cart.subtotalCents).toBe(9_000);
    expect(result.current.cart.isGuest).toBe(true);
    expect(getGuestCart()).toHaveLength(1);
  });

  it('adds to the line already there instead of a second one', async () => {
    const { result } = mountCart();

    await act(async () => {
      await result.current.add.mutateAsync({ quantity: 1, line });
      await result.current.add.mutateAsync({ quantity: 1, line });
    });

    await waitFor(() => {
      expect(result.current.cart.cart.items).toHaveLength(1);
    });
    expect(result.current.cart.cart.totalItems).toBe(2);
  });

  it('will not hold more than the stock on hand', async () => {
    const { result } = mountCart();

    await act(async () => {
      await result.current.add.mutateAsync({ quantity: 99, line });
    });

    await waitFor(() => {
      expect(result.current.cart.cart.totalItems).toBe(3);
    });
  });

  it('removes a line by the id the cart view gave it', async () => {
    const { result } = mountCart();

    await act(async () => {
      await result.current.add.mutateAsync({ quantity: 1, line });
    });
    await waitFor(() => {
      expect(result.current.cart.cart.items).toHaveLength(1);
    });

    await act(async () => {
      await result.current.remove.mutateAsync('v-1');
    });
    await waitFor(() => {
      expect(result.current.cart.cart.items).toHaveLength(0);
    });
  });

  it('never lets a quantity fall below one', async () => {
    const { result } = mountCart();

    await act(async () => {
      await result.current.add.mutateAsync({ quantity: 2, line });
      await result.current.update.mutateAsync({ itemId: 'v-1', quantity: 0 });
    });

    await waitFor(() => {
      expect(result.current.cart.cart.totalItems).toBe(1);
    });
  });
});

describe('useCart signed in', () => {
  it('reads the cart from the api', async () => {
    server.use(
      signedInAs(customer),
      http.get(`${API_URL}/cart`, () => HttpResponse.json(makeCart([makeCartLine()]))),
    );

    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isGuest).toBe(false);
    });
    await waitFor(() => {
      expect(result.current.cart.totalItems).toBe(2);
    });
  });

  it('takes the cart the api answers a write with, without a second round trip', async () => {
    let cartReads = 0;
    server.use(
      signedInAs(customer),
      http.get(`${API_URL}/cart`, () => {
        cartReads += 1;
        return HttpResponse.json(makeCart());
      }),
      http.post(`${API_URL}/cart/items`, () =>
        HttpResponse.json(makeCart([makeCartLine({ quantity: 1 })])),
      ),
    );

    const { result } = mountCart();
    await waitFor(() => {
      expect(result.current.cart.isGuest).toBe(false);
    });

    await act(async () => {
      await result.current.add.mutateAsync({ quantity: 1, line });
    });

    await waitFor(() => {
      expect(result.current.cart.cart.totalItems).toBe(1);
    });
    expect(cartReads).toBe(1);
    expect(getGuestCart()).toHaveLength(0);
  });
});

describe('useGuestCartMerge', () => {
  it('hands the browser cart to the server on sign-in and forgets it locally', async () => {
    let merged: CartItemInput[] = [];
    server.use(
      signedInAs(customer),
      http.get(`${API_URL}/cart`, () => HttpResponse.json(makeCart())),
      http.post(`${API_URL}/cart/merge`, async ({ request }) => {
        const body = (await request.json()) as { items: CartItemInput[] };
        merged = body.items;
        return HttpResponse.json(makeCart([makeCartLine({ quantity: 2 })]));
      }),
    );

    const guest = renderHook(() => useAddToCart(), { wrapper: createWrapper() });
    await act(async () => {
      await guest.result.current.mutateAsync({ quantity: 2, line });
    });
    guest.unmount();

    const { result } = renderHook(
      () => {
        useGuestCartMerge();
        return useCart();
      },
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(merged).toEqual([{ variantId: 'v-1', quantity: 2 }]);
    });
    await waitFor(() => {
      expect(result.current.cart.totalItems).toBe(2);
    });
    // cleared before the request goes out, so a failed merge can't replay next render
    expect(getGuestCart()).toHaveLength(0);
  });

  it('stays quiet when there is nothing to merge', async () => {
    let merges = 0;
    server.use(
      signedInAs(customer),
      http.get(`${API_URL}/cart`, () => HttpResponse.json(makeCart())),
      http.post(`${API_URL}/cart/merge`, () => {
        merges += 1;
        return HttpResponse.json(makeCart());
      }),
    );

    const { result } = renderHook(
      () => {
        useGuestCartMerge();
        return useCart();
      },
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isGuest).toBe(false);
    });
    expect(merges).toBe(0);
  });
});
