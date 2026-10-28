import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateOrderRequest } from '@/shared/api/contracts/commerce'
import { hasErrorCode, isApiError } from '@/shared/api/api-error'
import { realtimeStatus } from '@/shared/realtime/realtime-status'
import { privateQueryKey } from '@/features/auth/session-lifecycle'
import {
  connectWallet,
  createOrder,
  disconnectWallet,
  fetchActiveOrder,
  fetchOrder,
} from './checkout-api'

const ORDER_POLL_INTERVAL_MS = 1_000
const ORDER_POLL_WITH_REALTIME_MS = 5_000
const ORDER_RETRY_DELAY_MS = 800
const MAX_ORDER_RETRIES = 2

export const checkoutKeys = {
  createOrder: ['create-order'] as const,
  orders: (userId: string) => [...privateQueryKey(userId), 'orders'] as const,
  activeOrder: (userId: string) => [...checkoutKeys.orders(userId), 'active'] as const,
  order: (userId: string, orderId: string) => [...checkoutKeys.orders(userId), orderId] as const,
}

export function orderQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: checkoutKeys.order(userId, orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    refetchInterval: (query) => {
      if (query.state.data?.status !== 'pending') {
        return false
      }
      return realtimeStatus.get() === 'connected'
        ? ORDER_POLL_WITH_REALTIME_MS
        : ORDER_POLL_INTERVAL_MS
    },
    retry: (failureCount, error) => !hasErrorCode(error, 'NOT_FOUND') && failureCount < 3,
  })
}

export function activeOrderQueryOptions(userId: string) {
  return queryOptions({
    queryKey: checkoutKeys.activeOrder(userId),
    queryFn: ({ signal }) => fetchActiveOrder(signal),
  })
}

export function useConnectWallet() {
  return useMutation({ mutationFn: connectWallet })
}

export function useDisconnectWallet() {
  return useMutation({ mutationFn: disconnectWallet })
}

export interface CreateOrderVariables {
  payload: CreateOrderRequest
  idempotencyKey: string
}

export function useCreateOrder(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: checkoutKeys.createOrder,
    mutationFn: ({ payload, idempotencyKey }: CreateOrderVariables) =>
      createOrder(payload, idempotencyKey),
    retry: (failureCount, error) =>
      isApiError(error) && error.isRetryable && failureCount < MAX_ORDER_RETRIES,
    retryDelay: ORDER_RETRY_DELAY_MS,
    onSuccess: (order) => {
      queryClient.setQueryData(checkoutKeys.order(userId, order.id), order)
      void queryClient.invalidateQueries({ queryKey: checkoutKeys.activeOrder(userId) })
    },
  })
}
