import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_URL } from '../src/config/env';
import { addGuestLine } from '../src/features/cart/guestCart';
import { Cart } from '../src/pages/Cart';
import { customer, makeCart, makeCartLine } from './fixtures';
import { signedInAs } from './msw/handlers';
import { server } from './msw/server';
import { renderWithProviders } from './render';

const seedGuestLine = (quantity = 2, stock = 4) => {
  addGuestLine({
    variantId: 'v-1',
    quantity,
    sku: 'TEE-BLK-M',
    stock,
    unitPriceCents: 4_500,
    productId: 'p-1',
    productName: 'Ribbed Tee',
    productImage: '/media/tee.jpg',
    colorName: 'Black',
    sizeName: 'M',
  });
};

describe('Cart page', () => {
  it('points an empty cart back at the catalog', async () => {
    renderWithProviders(<Cart />);

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute(
      'href',
      '/catalog',
    );
  });

  describe('with a guest cart', () => {
    beforeEach(() => {
      seedGuestLine();
    });

    it('totals the line and the cart from the same unit price', async () => {
      renderWithProviders(<Cart />);

      expect(await screen.findByRole('link', { name: 'Ribbed Tee' })).toBeInTheDocument();
      expect(screen.getByText('Black · Size M')).toBeInTheDocument();
      // 2 x $45.00, in the line and again in the summary
      expect(screen.getAllByText('$90.00')).toHaveLength(2);
      expect(screen.getByText('$45.00')).toBeInTheDocument();
    });

    it('counts what is left to reach free shipping', async () => {
      renderWithProviders(<Cart />);

      expect(await screen.findByText('$10.00 away from free shipping.')).toBeInTheDocument();
    });

    it('changes quantity in place', async () => {
      const { user } = renderWithProviders(<Cart />);

      await user.click(
        await screen.findByRole('button', { name: 'Increase quantity of Ribbed Tee' }),
      );

      await waitFor(() => {
        expect(screen.getByText('3 items')).toBeInTheDocument();
      });
      expect(screen.getAllByText('$135.00')).toHaveLength(2);
    });

    it('stops at the stock on hand', async () => {
      const { user } = renderWithProviders(<Cart />);
      const increase = await screen.findByRole('button', {
        name: 'Increase quantity of Ribbed Tee',
      });

      await user.click(increase);
      await user.click(increase);

      await waitFor(() => {
        expect(increase).toBeDisabled();
      });
      expect(screen.getByText('4 items')).toBeInTheDocument();
    });

    it('sends a guest to sign in before checkout, and says the cart survives it', async () => {
      renderWithProviders(<Cart />);

      expect(await screen.findByRole('link', { name: 'Sign in to check out' })).toHaveAttribute(
        'href',
        '/login',
      );
      expect(screen.getByText('Your cart comes with you when you sign in.')).toBeInTheDocument();
    });
  });

  it('offers checkout to someone signed in, and reads the cart from the api', async () => {
    server.use(
      signedInAs(customer),
      http.get(`${API_URL}/cart`, () =>
        HttpResponse.json(makeCart([makeCartLine({ quantity: 3, unitPriceCents: 4_000 })])),
      ),
    );

    renderWithProviders(<Cart />);

    expect(await screen.findByRole('link', { name: 'Proceed to checkout' })).toHaveAttribute(
      'href',
      '/checkout',
    );
    expect(screen.getByText('3 items')).toBeInTheDocument();
    expect(screen.getAllByText('$120.00')).toHaveLength(2);
  });
});
