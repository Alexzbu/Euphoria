import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductCard } from '../src/features/catalog/ProductCard';
import { makeProduct } from './fixtures';
import { renderWithProviders } from './render';

describe('ProductCard', () => {
  it('shows the product it was given', () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);

    expect(screen.getByRole('link', { name: 'Ribbed Tee' })).toHaveAttribute(
      'href',
      '/products/p-1',
    );
    expect(screen.getByText('Nike · Tops')).toBeInTheDocument();
    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });

  it('says so when a product has no photo', () => {
    renderWithProviders(<ProductCard product={makeProduct({ images: [] })} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('No photo yet')).toBeInTheDocument();
  });

  it('loads the first card eagerly and the rest lazily', () => {
    const { rerender } = renderWithProviders(<ProductCard product={makeProduct()} eager />);
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute('loading', 'eager');

    rerender(<ProductCard product={makeProduct()} />);
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute('loading', 'lazy');
  });
});
