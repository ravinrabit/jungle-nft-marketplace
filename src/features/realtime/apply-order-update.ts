import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Order } from '@/shared/api/contracts/commerce'
import type { OrderUpdatedEvent } from '@/shared/api/contracts/events'
import { checkoutKeys } from '@/features/checkout/api/checkout-queries'

const STATUS_MESSAGES = {
  confirmed: 'Sua compra foi confirmada na rede.',
  declined: 'Sua compra não foi concluída.',
} as const

interface OrderUpdateContext {
  userId: string
  isViewingOrder: (orderId: string) => boolean
  openOrder: (orderId: string) => void
}

export function applyOrderUpdate(
  queryClient: QueryClient,
  event: OrderUpdatedEvent,
  { userId, isViewingOrder, openOrder }: OrderUpdateContext,
) {
  const orderId = event.resource.id
  queryClient.setQueryData<Order>(checkoutKeys.order(userId, orderId), (order) =>
    order && order.version < event.version
      ? { ...order, ...event.data, version: event.version, updatedAt: event.occurredAt }
      : order,
  )
  void queryClient.invalidateQueries({ queryKey: checkoutKeys.activeOrder(userId) })

  if (event.data.status === 'pending' || isViewingOrder(orderId)) {
    return
  }
  const notify = event.data.status === 'confirmed' ? toast.success : toast.error
  notify(STATUS_MESSAGES[event.data.status], {
    id: `order-${orderId}`,
    action: {
      label: 'Ver pedido',
      onClick: () => {
        openOrder(orderId)
      },
    },
  })
}
