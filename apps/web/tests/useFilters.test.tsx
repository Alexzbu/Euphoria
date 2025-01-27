import { act, renderHook } from '@testing-library/react';
import { useSearchParams } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { parseCatalogQuery } from '../src/features/catalog/catalogQuery';
import { useFilters } from '../src/features/catalog/useFilters';
import { createWrapper } from './render';

function mount(search: string) {
  return renderHook(() => ({ filters: useFilters(), params: useSearchParams()[0] }), {
    wrapper: createWrapper({ route: `/catalog${search}` }),
  });
}

const query = (params: URLSearchParams) => params.toString();

describe('parseCatalogQuery', () => {
  it('splits a comma list, lowercases it and drops duplicates', () => {
    const parsed = parseCatalogQuery(new URLSearchParams('brand=Nike,nike,ADIDAS'));
    expect(parsed.brand).toEqual(['nike', 'adidas']);
  });

  it('defaults to the first page', () => {
    expect(parseCatalogQuery(new URLSearchParams()).page).toBe(1);
  });

  it('ignores a page that is not a whole number', () => {
    expect(parseCatalogQuery(new URLSearchParams('page=2.5')).page).toBe(1);
  });

  it('keeps prices in cents', () => {
    const parsed = parseCatalogQuery(new URLSearchParams('priceMin=1000&priceMax=5000'));
    expect(parsed).toMatchObject({ priceMin: 1_000, priceMax: 5_000 });
  });

  it('drops a blank search', () => {
    expect(parseCatalogQuery(new URLSearchParams('search=%20%20')).search).toBeUndefined();
  });
});

describe('useFilters', () => {
  it('adds a slug to the url and takes it off again', async () => {
    const { result } = mount('');

    await act(async () => {
      result.current.filters.toggle('brand', 'nike');
    });
    expect(query(result.current.params)).toBe('brand=nike');

    await act(async () => {
      result.current.filters.toggle('brand', 'adidas');
    });
    expect(query(result.current.params)).toBe('brand=nike%2Cadidas');

    await act(async () => {
      result.current.filters.toggle('brand', 'nike');
    });
    expect(query(result.current.params)).toBe('brand=adidas');
  });

  // page 4 of a listing that just got narrower is usually empty, and an empty grid
  // reads as "no matches" when it means "wrong page"
  it('sends the reader back to page one whenever the filters move', async () => {
    const { result } = mount('?page=4');

    await act(async () => {
      result.current.filters.toggle('size', 'm');
    });
    expect(result.current.params.get('page')).toBeNull();
  });

  it('writes and clears each price bound on its own', async () => {
    const { result } = mount('');

    await act(async () => {
      result.current.filters.setPrice(1_000, 5_000);
    });
    expect(result.current.filters.price).toEqual({ min: 1_000, max: 5_000 });

    await act(async () => {
      result.current.filters.setPrice(1_000, undefined);
    });
    expect(query(result.current.params)).toBe('priceMin=1000');
  });

  it('lists a chip per selection, plus price and search', () => {
    const { result } = mount('?brand=nike&size=m,l&priceMin=1000&search=coat');

    expect(result.current.filters.active).toEqual([
      { key: 'brand', value: 'nike' },
      { key: 'size', value: 'm' },
      { key: 'size', value: 'l' },
      { key: 'price', value: 'price' },
      { key: 'search', value: 'coat' },
    ]);
  });

  it('removing the price chip clears both ends of the range', async () => {
    const { result } = mount('?priceMin=1000&priceMax=5000');

    await act(async () => {
      result.current.filters.remove({ key: 'price', value: 'price' });
    });
    expect(query(result.current.params)).toBe('');
  });

  it('removing the search chip leaves the other filters alone', async () => {
    const { result } = mount('?brand=nike&search=coat');

    await act(async () => {
      result.current.filters.remove({ key: 'search', value: 'coat' });
    });
    expect(query(result.current.params)).toBe('brand=nike');
  });

  it('clears everything at once', async () => {
    const { result } = mount('?brand=nike&size=m&priceMin=1000&search=coat');

    await act(async () => {
      result.current.filters.clearAll();
    });
    expect(query(result.current.params)).toBe('');
    expect(result.current.filters.active).toEqual([]);
  });
});
