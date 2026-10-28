import {
  SOCKET_EVENTS,
  type NftUpdatedEvent,
  type OrderUpdatedEvent,
} from '@/shared/api/contracts/events'
import type { NftRecord, OrderRecord } from '@/mocks/db/records'

export function toNftUpdatedEvent(nft: NftRecord): NftUpdatedEvent {
  return {
    eventId: `evt-${crypto.randomUUID()}`,
    type: SOCKET_EVENTS.nftUpdated,
    version: nft.version,
    occurredAt: nft.updatedAt,
    resource: { type: 'nft', id: nft.id },
    data: {
      price: nft.price,
      compareAtPrice: nft.compareAtPrice,
      isAvailable: nft.isAvailable,
      editions: nft.editions.map(({ kind, available, price }) => ({ kind, available, price })),
    },
  }
}

export function toOrderUpdatedEvent(order: OrderRecord): OrderUpdatedEvent {
  return {
    eventId: `evt-${crypto.randomUUID()}`,
    type: SOCKET_EVENTS.orderUpdated,
    version: order.version,
    occurredAt: order.updatedAt,
    resource: { type: 'order', id: order.id },
    data: {
      status: order.status,
      transactionHash: order.transactionHash,
      explorerUrl: order.explorerUrl,
      declineReason: order.declineReason,
    },
  }
}
