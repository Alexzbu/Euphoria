import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import * as admin from '../../api/admin';
import { catalogKeys } from '../catalog/queries';
import type { AdminProduct, AdminVariant, TaxonomyKind } from '../../api/types';

export const adminKeys = {
  variants: (productId: string) => ['admin', 'variants', productId] as const,
};

// anything that changes a product changes what shoppers see, so the catalog's
// cached pages go with it
function useCatalogInvalidation() {
  const queryClient = useQueryClient();

  return async (productId?: string) => {
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    if (productId)
      await queryClient.invalidateQueries({ queryKey: catalogKeys.product(productId) });
  };
}

export function useSaveProduct() {
  const invalidate = useCatalogInvalidation();

  return useMutation({
    mutationFn: ({ id, form }: { id?: string; form: FormData }): Promise<AdminProduct> =>
      id ? admin.updateProduct(id, form) : admin.createProduct(form),
    onSuccess: (product) => invalidate(product.id),
  });
}

export function useDeleteProduct() {
  const invalidate = useCatalogInvalidation();

  return useMutation({
    mutationFn: admin.deleteProduct,
    onSuccess: () => invalidate(),
  });
}

export function useVariants(productId: string | null): UseQueryResult<AdminVariant[]> {
  return useQuery({
    queryKey: adminKeys.variants(productId ?? ''),
    queryFn: () => admin.listVariants(productId ?? ''),
    enabled: productId !== null,
  });
}

function useVariantMutation<TInput>(run: (input: TInput) => Promise<unknown>, productId: string) {
  const queryClient = useQueryClient();
  const invalidate = useCatalogInvalidation();

  return useMutation({
    mutationFn: run,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.variants(productId) });
      await invalidate(productId);
    },
  });
}

export function useCreateVariant(productId: string) {
  return useVariantMutation(
    (input: admin.VariantInput) => admin.createVariant(productId, input),
    productId,
  );
}

export function useUpdateVariant(productId: string) {
  return useVariantMutation(
    ({ id, ...input }: Partial<admin.VariantInput> & { id: string }) =>
      admin.updateVariant(id, input),
    productId,
  );
}

export function useDeleteVariant(productId: string) {
  return useVariantMutation((id: string) => admin.deleteVariant(id), productId);
}

// every taxonomy edit changes the filter panel and the product form's selects, and
// both read the one cached map
function useTaxonomyMutation<TInput>(run: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.taxonomy }),
  });
}

export function useCreateTaxonomy(kind: TaxonomyKind) {
  return useTaxonomyMutation((name: string) => admin.createTaxonomy(kind, name));
}

export function useRenameTaxonomy(kind: TaxonomyKind) {
  return useTaxonomyMutation(({ id, name }: { id: string; name: string }) =>
    admin.renameTaxonomy(kind, id, name),
  );
}

export function useDeleteTaxonomy(kind: TaxonomyKind) {
  return useTaxonomyMutation((id: string) => admin.deleteTaxonomy(kind, id));
}
