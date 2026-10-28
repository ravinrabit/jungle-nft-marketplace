import type { Query, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Session } from '@/shared/api/contracts/account'
import {
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
  SOCKET_CLIENT_EVENTS,
  SOCKET_EVENTS,
} from '@/shared/api/contracts/events'
import { env } from '@/shared/config/env'
import { realtimeStatus } from '@/shared/realtime/realtime-status'
import {
  authKeys,
  onSessionEnded,
  onSessionStarted,
  PRIVATE_QUERY_ROOT,
} from '@/features/auth/session-lifecycle'
import { sessionToken } from '@/features/auth/session-token'
import { catalogKeys } from '@/features/catalog/api/catalog-queries'
import {
  applyNftUpdate,
  isCartQuery,
  isQuoteQuery,
  refetchDiscardingInFlight,
} from './apply-nft-update'
import { applyOrderUpdate } from './apply-order-update'
import { EventLedger } from './event-ledger'

const RECONNECTED_TOAST_ID = 'realtime-reconnected'
const CONNECTION_TIMEOUT_MS = 5_000

interface RealtimeSyncOptions {
  queryClient: QueryClient
  openOrder: (orderId: string) => void
}

function isOrderQuery(query: Query) {
  return query.queryKey[0] === PRIVATE_QUERY_ROOT && query.queryKey[2] === 'orders'
}

function reconcile(queryClient: QueryClient) {
  void refetchDiscardingInFlight(queryClient, { queryKey: catalogKeys.all })
  void refetchDiscardingInFlight(queryClient, { predicate: isCartQuery })
  void refetchDiscardingInFlight(queryClient, { predicate: isQuoteQuery })
  void refetchDiscardingInFlight(queryClient, { predicate: isOrderQuery })
}

export async function startRealtimeSync({ queryClient, openOrder }: RealtimeSyncOptions) {
  const { io } = await import('socket.io-client')
  const socket = io(env.socketUrl, {
    transports: ['websocket'],
    autoConnect: false,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 8_000,
    timeout: CONNECTION_TIMEOUT_MS,
  })
  const ledger = new EventLedger()
  let hasConnected = false

  const identify = () => {
    if (socket.connected) {
      socket.emit(SOCKET_CLIENT_EVENTS.identify, { token: sessionToken.read() })
    }
  }

  const markOffline = () => {
    realtimeStatus.set(hasConnected ? 'reconnecting' : 'unavailable')
  }

  socket.on('connect', () => {
    realtimeStatus.set('connected')
    identify()
    if (hasConnected) {
      reconcile(queryClient)
      toast.success('Atualizações em tempo real restabelecidas.', { id: RECONNECTED_TOAST_ID })
    }
    hasConnected = true
  })
  socket.on('disconnect', markOffline)
  socket.on('connect_error', markOffline)

  socket.on(SOCKET_EVENTS.nftUpdated, (payload: unknown) => {
    const event = nftUpdatedEventSchema.safeParse(payload)
    if (event.success && ledger.accept(event.data)) {
      applyNftUpdate(queryClient, event.data)
    }
  })

  socket.on(SOCKET_EVENTS.orderUpdated, (payload: unknown) => {
    const event = orderUpdatedEventSchema.safeParse(payload)
    const userId = queryClient.getQueryData<Session | null>(authKeys.session)?.user.id
    if (!event.success || !userId || !ledger.accept(event.data)) {
      return
    }
    applyOrderUpdate(queryClient, event.data, {
      userId,
      openOrder,
      isViewingOrder: (orderId) => window.location.pathname === `/pedidos/${orderId}`,
    })
  })

  const stopListeningStart = onSessionStarted(() => {
    identify()
    return Promise.resolve()
  })
  const stopListeningEnd = onSessionEnded(identify)

  realtimeStatus.set('connecting')
  socket.connect()

  return () => {
    stopListeningStart()
    stopListeningEnd()
    socket.disconnect()
    realtimeStatus.set('idle')
  }
}
