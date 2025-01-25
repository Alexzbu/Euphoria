import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { cancelOrder, getOrder, listOrders } from '../../api/orders';
import type { Order, OrderPage } from './types';

export const orderKeys = {
  list: (page: number) => ['orders', page] as const,
  detail: (id: string) => ['order', id] as const,
};

export function useOrders(page: number): UseQueryResult<OrderPage> {
  return useQuery({
    queryKey: orderKeys.list(page),
    queryFn: () => listOrders({ page, limit: 10 }),
  });
}

// fetched only when a row is opened. a history page doesn't need every line of
// every order to draw a list.
export function useOrder(id: string | null): UseQueryResult<Order> {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => getOrder(id ?? ''),
    enabled: id !== null,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: async (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      // the list carries the status too, and it's now wrong
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
