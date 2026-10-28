import {
  activeOrderResponseSchema,
  IDEMPOTENCY_KEY_HEADER,
  orderSchema,
  walletConnectionSchema,
  type CreateOrderRequest,
  type WalletConnectionRequest,
} from '@/shared/api/contracts/commerce'
import { requestData, requestWithoutContent } from '@/shared/api/http-client'

export function connectWallet(payload: WalletConnectionRequest) {
  return requestData(walletConnectionSchema, {
    method: 'POST',
    url: '/wallet/connections',
    data: payload,
  })
}

export function disconnectWallet(connectionId: string) {
  return requestWithoutContent({
    method: 'DELETE',
    url: `/wallet/connections/${encodeURIComponent(connectionId)}`,
  })
}

export function createOrder(payload: CreateOrderRequest, idempotencyKey: string) {
  return requestData(orderSchema, {
    method: 'POST',
    url: '/orders',
    headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
    data: payload,
  })
}

export function fetchOrder(orderId: string, signal: AbortSignal) {
  return requestData(orderSchema, {
    method: 'GET',
    url: `/orders/${encodeURIComponent(orderId)}`,
    signal,
  })
}

export function fetchActiveOrder(signal: AbortSignal) {
  return requestData(activeOrderResponseSchema, { method: 'GET', url: '/orders/active', signal })
}
