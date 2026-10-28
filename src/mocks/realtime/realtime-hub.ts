import type { toSocketIo } from '@mswjs/socket.io-binding'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/shared/api/contracts/events'
import type { NftRecord, OrderRecord } from '@/mocks/db/records'
import { getActiveScenario } from '@/mocks/network/scenarios'
import { toNftUpdatedEvent, toOrderUpdatedEvent } from './realtime-events'

type SocketConnection = ReturnType<typeof toSocketIo>
type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export interface Subscriber {
  socket: SocketConnection
  userId: string | null
}

const subscribers = new Set<Subscriber>()
const previousEvents = new Map<string, RealtimeEvent>()

function resourceKey(event: RealtimeEvent) {
  return `${event.resource.type}:${event.resource.id}`
}

function deliver(subscriber: Subscriber, event: RealtimeEvent, stale: RealtimeEvent | undefined) {
  subscriber.socket.client.emit(event.type, event)
  if (!getActiveScenario().realtimeChaos) {
    return
  }
  subscriber.socket.client.emit(event.type, event)
  if (stale) {
    subscriber.socket.client.emit(stale.type, stale)
  }
}

function broadcast(event: RealtimeEvent, audience: (subscriber: Subscriber) => boolean) {
  const key = resourceKey(event)
  const stale = previousEvents.get(key)
  previousEvents.set(key, event)
  for (const subscriber of subscribers) {
    if (audience(subscriber)) {
      deliver(subscriber, event, stale)
    }
  }
}

export function registerSubscriber(socket: SocketConnection) {
  const subscriber: Subscriber = { socket, userId: null }
  subscribers.add(subscriber)
  return subscriber
}

export function unregisterSubscriber(subscriber: Subscriber) {
  subscribers.delete(subscriber)
}

export function publishNftUpdate(nft: NftRecord) {
  broadcast(toNftUpdatedEvent(nft), () => true)
}

export function publishOrderUpdate(order: OrderRecord) {
  broadcast(toOrderUpdatedEvent(order), (subscriber) => subscriber.userId === order.userId)
}

export function disconnectAllSubscribers() {
  for (const subscriber of subscribers) {
    subscriber.socket.rawClient.close()
  }
}
