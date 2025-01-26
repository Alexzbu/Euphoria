import { request } from './client';
import type { AdminProduct, AdminVariant, TaxonomyKind, TaxonomyRef } from './types';

// Products go up as multipart, because the photos travel with the fields. Every
// value in a multipart body is a string, which the api's schemas coerce back.

export async function createProduct(form: FormData): Promise<AdminProduct> {
  const { product } = await request<{ product: AdminProduct }>('/admin/products', {
    method: 'POST',
    body: form,
  });
  return product;
}

export async function updateProduct(id: string, form: FormData): Promise<AdminProduct> {
  const { product } = await request<{ product: AdminProduct }>(`/admin/products/${id}`, {
    method: 'PATCH',
    body: form,
  });
  return product;
}

export function deleteProduct(id: string): Promise<void> {
  return request<void>(`/admin/products/${id}`, { method: 'DELETE' });
}

export async function listVariants(productId: string): Promise<AdminVariant[]> {
  const { items } = await request<{ items: AdminVariant[] }>(
    `/admin/products/${productId}/variants`,
  );
  return items;
}

export interface VariantInput {
  color: string;
  size: string;
  sku?: string;
  stock: number;
}

export async function createVariant(productId: string, input: VariantInput): Promise<AdminVariant> {
  const { variant } = await request<{ variant: AdminVariant }>(
    `/admin/products/${productId}/variants`,
    { method: 'POST', body: input },
  );
  return variant;
}

export async function updateVariant(
  id: string,
  input: Partial<VariantInput>,
): Promise<AdminVariant> {
  const { variant } = await request<{ variant: AdminVariant }>(`/admin/variants/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return variant;
}

export function deleteVariant(id: string): Promise<void> {
  return request<void>(`/admin/variants/${id}`, { method: 'DELETE' });
}

export async function createTaxonomy(kind: TaxonomyKind, name: string): Promise<TaxonomyRef> {
  const { item } = await request<{ item: TaxonomyRef }>(`/admin/taxonomy/${kind}`, {
    method: 'POST',
    body: { name },
  });
  return item;
}

export async function renameTaxonomy(
  kind: TaxonomyKind,
  id: string,
  name: string,
): Promise<TaxonomyRef> {
  const { item } = await request<{ item: TaxonomyRef }>(`/admin/taxonomy/${kind}/${id}`, {
    method: 'PATCH',
    body: { name },
  });
  return item;
}

export function deleteTaxonomy(kind: TaxonomyKind, id: string): Promise<void> {
  return request<void>(`/admin/taxonomy/${kind}/${id}`, { method: 'DELETE' });
}
