import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getProduct, getTaxonomy, listProducts, type ProductQuery } from '../../api/catalog';
import type { Page, ProductDetail, ProductSummary, TaxonomyMap } from '../../api/types';

export const catalogKeys = {
  products: (query: ProductQuery) => ['products', query] as const,
  product: (id: string) => ['product', id] as const,
  taxonomy: ['taxonomy'] as const,
};

export function useProducts(query: ProductQuery = {}): UseQueryResult<Page<ProductSummary>> {
  return useQuery({
    queryKey: catalogKeys.products(query),
    queryFn: () => listProducts(query),
  });
}

export function useProduct(id: string): UseQueryResult<ProductDetail> {
  return useQuery({
    queryKey: catalogKeys.product(id),
    queryFn: () => getProduct(id),
  });
}

// brands, colours, sizes, categories and sexes barely change, and the filter panel
// needs all five before it can draw anything
export function useTaxonomy(): UseQueryResult<TaxonomyMap> {
  return useQuery({
    queryKey: catalogKeys.taxonomy,
    queryFn: getTaxonomy,
    staleTime: 5 * 60_000,
  });
}
