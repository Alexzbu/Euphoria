import { request } from './client';
import type {
  Page,
  ProductDetail,
  ProductSummary,
  TaxonomyKind,
  TaxonomyMap,
  TaxonomyRef,
} from './types';

// a type, not an interface: only a type alias picks up an implicit index
// signature, and the client's query builder wants one
export type ProductQuery = {
  page?: number;
  limit?: number;
  brand?: string[];
  category?: string[];
  sex?: string[];
  color?: string[];
  size?: string[];
  priceMin?: number;
  priceMax?: number;
  search?: string;
};

export function listProducts(query: ProductQuery = {}): Promise<Page<ProductSummary>> {
  return request<Page<ProductSummary>>('/products', { query });
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const { product } = await request<{ product: ProductDetail }>(`/products/${id}`);
  return product;
}

export function getTaxonomy(): Promise<TaxonomyMap> {
  return request<TaxonomyMap>('/taxonomy');
}

export async function listTaxonomy(kind: TaxonomyKind): Promise<TaxonomyRef[]> {
  const { items } = await request<{ items: TaxonomyRef[] }>(`/taxonomy/${kind}`);
  return items;
}
