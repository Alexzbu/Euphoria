import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { useProduct, useProducts, useTaxonomy } from '../src/features/catalog/queries';
import { API_URL } from '../src/config/env';
import { makePage, makeProduct } from './fixtures';
import { apiError } from './msw/handlers';
import { server } from './msw/server';
import { createQueryClient } from '../src/app/queryClient';
import { createTestQueryClient, createWrapper } from './render';

const url = (path: string) => `${API_URL}${path}`;

describe('catalog queries', () => {
  it('passes the filters straight through to the api', async () => {
    let seen = '';
    server.use(
      http.get(url('/products'), ({ request }) => {
        seen = new URL(request.url).search;
        return HttpResponse.json(makePage([makeProduct()]));
      }),
    );

    const { result } = renderHook(() => useProducts({ brand: ['nike'], page: 2, limit: 12 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.items).toHaveLength(1);
    });
    expect(seen).toBe('?brand=nike&page=2&limit=12');
  });

  it('caches by the query, so two different filters are two results', async () => {
    let reads = 0;
    server.use(
      http.get(url('/products'), () => {
        reads += 1;
        return HttpResponse.json(makePage([makeProduct()]));
      }),
    );

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper({ queryClient });

    const first = renderHook(() => useProducts({ brand: ['nike'] }), { wrapper });
    await waitFor(() => {
      expect(first.result.current.isSuccess).toBe(true);
    });

    const second = renderHook(() => useProducts({ brand: ['adidas'] }), { wrapper });
    await waitFor(() => {
      expect(second.result.current.isSuccess).toBe(true);
    });

    expect(reads).toBe(2);
  });

  it('unwraps the product envelope', async () => {
    const { result } = renderHook(() => useProduct('p-1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toMatchObject({ id: 'p-1', name: 'Ribbed Tee' });
    });
    expect(result.current.data?.variants).toHaveLength(1);
  });

  // a 404 answers the same way however many times it's asked
  it('does not retry a product that is not there', async () => {
    let reads = 0;
    server.use(
      http.get(url('/products/p-9'), () => {
        reads += 1;
        return apiError(404, 'NOT_FOUND', 'No such product');
      }),
    );

    const { result } = renderHook(() => useProduct('p-9'), {
      // the app's own client, so this is the real retry rule under test and not the
      // blanket "never" the other cases run with
      wrapper: createWrapper({ queryClient: createQueryClient() }),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(reads).toBe(1);
    expect(result.current.error).toMatchObject({ status: 404 });
  });

  it('holds the taxonomy still while a page filters against it', async () => {
    let reads = 0;
    server.use(
      http.get(url('/taxonomy'), () => {
        reads += 1;
        return HttpResponse.json({ brands: [], categories: [], colors: [], sizes: [], sexes: [] });
      }),
    );

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper({ queryClient });

    const panel = renderHook(() => useTaxonomy(), { wrapper });
    await waitFor(() => {
      expect(panel.result.current.isSuccess).toBe(true);
    });

    const chips = renderHook(() => useTaxonomy(), { wrapper });
    await waitFor(() => {
      expect(chips.result.current.isSuccess).toBe(true);
    });

    expect(reads).toBe(1);
  });
});
