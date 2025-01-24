import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FILTER_KEYS, parseCatalogQuery, type FilterKey } from './catalogQuery';

export interface ActiveFilter {
  key: FilterKey | 'price' | 'search';
  value: string;
}

export interface Filters {
  selected: (key: FilterKey) => string[];
  toggle: (key: FilterKey, slug: string) => void;
  price: { min?: number; max?: number };
  setPrice: (min: number | undefined, max: number | undefined) => void;
  active: ActiveFilter[];
  remove: (filter: ActiveFilter) => void;
  clearAll: () => void;
}

// Everything a filter control needs, and the single place the query string is
// written. Any change drops `page`: page 4 of a listing that just got narrower is
// usually empty, and an empty grid reads as "no matches" when it means "wrong page".
export function useFilters(): Filters {
  const [params, setParams] = useSearchParams();

  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params);
      mutate(next);
      next.delete('page');
      setParams(next);
    },
    [params, setParams],
  );

  const query = useMemo(() => parseCatalogQuery(params), [params]);

  const selected = useCallback((key: FilterKey) => query[key] ?? [], [query]);

  const toggle = useCallback(
    (key: FilterKey, slug: string) => {
      const current = query[key] ?? [];
      const next = current.includes(slug)
        ? current.filter((value) => value !== slug)
        : [...current, slug];

      update((params) => {
        if (next.length > 0) params.set(key, next.join(','));
        else params.delete(key);
      });
    },
    [query, update],
  );

  const setPrice = useCallback(
    (min: number | undefined, max: number | undefined) => {
      update((params) => {
        if (min === undefined) params.delete('priceMin');
        else params.set('priceMin', String(min));

        if (max === undefined) params.delete('priceMax');
        else params.set('priceMax', String(max));
      });
    },
    [update],
  );

  const active = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = FILTER_KEYS.flatMap((key) =>
      (query[key] ?? []).map((value) => ({ key, value })),
    );

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      chips.push({ key: 'price', value: 'price' });
    }
    if (query.search) chips.push({ key: 'search', value: query.search });

    return chips;
  }, [query]);

  const remove = useCallback(
    (filter: ActiveFilter) => {
      if (filter.key === 'price') {
        setPrice(undefined, undefined);
        return;
      }
      if (filter.key === 'search') {
        update((params) => params.delete('search'));
        return;
      }
      toggle(filter.key, filter.value);
    },
    [setPrice, toggle, update],
  );

  const clearAll = useCallback(() => {
    setParams(new URLSearchParams());
  }, [setParams]);

  return {
    selected,
    toggle,
    price: { min: query.priceMin, max: query.priceMax },
    setPrice,
    active,
    remove,
    clearAll,
  };
}
