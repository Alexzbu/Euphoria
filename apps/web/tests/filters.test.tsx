import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActiveFilters } from '../src/features/catalog/ActiveFilters';
import { FilterGroup } from '../src/features/catalog/FilterGroup';
import { FilterPanel } from '../src/features/catalog/FilterPanel';
import { BRANDS, COLORS } from './fixtures';
import { renderWithProviders } from './render';
import type { Filters } from '../src/features/catalog/useFilters';

// the components take the whole filter object, so a stub is the cheapest way to
// put one in a known state. what useFilters does with a click is its own test.
function stubFilters(overrides: Partial<Filters> = {}): Filters {
  return {
    selected: () => [],
    toggle: vi.fn(),
    price: {},
    setPrice: vi.fn(),
    active: [],
    remove: vi.fn(),
    clearAll: vi.fn(),
    ...overrides,
  };
}

describe('FilterGroup', () => {
  it('draws nothing when the taxonomy is empty', () => {
    const { container } = renderWithProviders(
      <FilterGroup title="Brand" filterKey="brand" items={[]} selected={[]} onToggle={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('checks the options that are selected', () => {
    renderWithProviders(
      <FilterGroup
        title="Brand"
        filterKey="brand"
        items={BRANDS}
        selected={['adidas']}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Nike' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Adidas' })).toBeChecked();
  });

  it('toggles by slug, not by label', async () => {
    const onToggle = vi.fn();
    const { user } = renderWithProviders(
      <FilterGroup
        title="Brand"
        filterKey="brand"
        items={BRANDS}
        selected={[]}
        onToggle={onToggle}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Nike' }));
    expect(onToggle).toHaveBeenCalledWith('brand', 'nike');
  });

  it('keeps a swatch readable when the only cue is a colour', () => {
    renderWithProviders(
      <FilterGroup
        title="Colour"
        filterKey="color"
        items={COLORS}
        selected={[]}
        onToggle={vi.fn()}
        variant="swatch"
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Black' })).toBeInTheDocument();
  });
});

describe('FilterPanel', () => {
  it('builds a section per taxonomy once it has one', async () => {
    renderWithProviders(<FilterPanel filters={stubFilters()} />);

    expect(await screen.findByRole('button', { name: /Category/ })).toBeInTheDocument();
    for (const title of ['Price', 'Colour', 'Size', 'Brand', 'Department']) {
      expect(screen.getByRole('button', { name: new RegExp(title) })).toBeInTheDocument();
    }
  });

  it('offers a reset only when there is something to reset', async () => {
    const filters = stubFilters();
    const { rerender } = renderWithProviders(<FilterPanel filters={filters} />);

    await screen.findByRole('button', { name: /Category/ });
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();

    rerender(<FilterPanel filters={{ ...filters, active: [{ key: 'brand', value: 'nike' }] }} />);
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
  });
});

describe('ActiveFilters', () => {
  it('draws nothing with no filters on', () => {
    const { container } = renderWithProviders(<ActiveFilters filters={stubFilters()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('labels a chip with the name that was clicked, not the slug in the url', async () => {
    renderWithProviders(
      <ActiveFilters filters={stubFilters({ active: [{ key: 'brand', value: 'nike' }] })} />,
    );

    expect(await screen.findByRole('button', { name: /^Nike/ })).toBeInTheDocument();
  });

  it('reads a price filter back as a range', () => {
    renderWithProviders(
      <ActiveFilters
        filters={stubFilters({
          active: [{ key: 'price', value: 'price' }],
          price: { min: 1_000, max: 5_000 },
        })}
      />,
    );

    expect(screen.getByRole('button', { name: /\$10\.00 – \$50\.00/ })).toBeInTheDocument();
  });

  it('reads a one-sided price filter as an open end', () => {
    renderWithProviders(
      <ActiveFilters
        filters={stubFilters({ active: [{ key: 'price', value: 'price' }], price: { min: 1_000 } })}
      />,
    );

    expect(screen.getByRole('button', { name: /From \$10\.00/ })).toBeInTheDocument();
  });

  it('quotes a search term', () => {
    renderWithProviders(
      <ActiveFilters filters={stubFilters({ active: [{ key: 'search', value: 'coat' }] })} />,
    );

    expect(screen.getByRole('button', { name: /“coat”/ })).toBeInTheDocument();
  });

  it('removes the chip that was clicked', async () => {
    const remove = vi.fn();
    const filter = { key: 'brand', value: 'nike' } as const;
    const { user } = renderWithProviders(
      <ActiveFilters filters={stubFilters({ active: [filter], remove })} />,
    );

    await user.click(await screen.findByRole('button', { name: /^Nike/ }));
    expect(remove).toHaveBeenCalledWith(filter);
  });
});
