import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductQuery } from '../../api/catalog';

// the url is the state. a filtered catalog is a link someone can send, and the
// back button walks the filters the way a person expects it to.

export const FILTER_KEYS = ['brand', 'category', 'sex', 'color', 'size'] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

export const DEFAULT_PAGE_SIZE = 12;

function readInt(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null) return undefined;

  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : undefined;
}

function readList(params: URLSearchParams, key: FilterKey): string[] | undefined {
  const values = params
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

  return values.length > 0 ? [...new Set(values)] : undefined;
}

export function parseCatalogQuery(params: URLSearchParams): ProductQuery {
  const query: ProductQuery = {
    page: readInt(params, 'page') ?? 1,
    limit: DEFAULT_PAGE_SIZE,
  };

  for (const key of FILTER_KEYS) {
    const values = readList(params, key);
    if (values) query[key] = values;
  }

  // cents, the same unit the api filters in. a ui showing dollars converts on the
  // way in and out.
  const priceMin = readInt(params, 'priceMin');
  const priceMax = readInt(params, 'priceMax');
  if (priceMin !== undefined) query.priceMin = priceMin;
  if (priceMax !== undefined && priceMax > 0) query.priceMax = priceMax;

  const search = params.get('search')?.trim();
  if (search) query.search = search;

  return query;
}

export function useCatalogQuery(): ProductQuery {
  const [params] = useSearchParams();
  return useMemo(() => parseCatalogQuery(params), [params]);
}
