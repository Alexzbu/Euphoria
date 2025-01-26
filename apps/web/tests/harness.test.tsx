import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAuth } from '../src/features/auth/useAuth';
import { useTaxonomy } from '../src/features/catalog/queries';
import { renderWithProviders } from './render';

function Probe() {
  const { status } = useAuth();
  const { data } = useTaxonomy();

  return (
    <output>
      {status}:{data?.brands.map((brand) => brand.name).join(',') ?? '…'}
    </output>
  );
}

describe('test harness', () => {
  it('renders a component through the providers and the mocked api', async () => {
    renderWithProviders(<Probe />);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('anonymous:Nike,Adidas');
    });
  });
});
