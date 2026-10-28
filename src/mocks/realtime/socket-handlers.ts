import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { z } from 'zod'
import { SOCKET_CLIENT_EVENTS } from '@/shared/api/contracts/events'
import { env } from '@/shared/config/env'
import { findActiveSessionUserId } from '@/mocks/domain/sessions'
import { getActiveScenario } from '@/mocks/network/scenarios'
import { settlePendingOrders } from './market-events'
import { registerSubscriber, unregisterSubscriber } from './realtime-hub'

const HEARTBEAT_INTERVAL_MS = 20_000
const CHAOS_DISCONNECT_AFTER_MS = 20_000
const ENGINE_IO_PING = '2'

const identifyPayloadSchema = z.object({ token: z.string().min(1).nullable() })

const SOCKET_IO_PATH = '/socket.io/'

const realtimeLink = ws.link(env.socketUrl.replace(/^http/, 'ws'))

export const realtimeHandlers = [
  realtimeLink.addEventListener('connection', (connection) => {
    if (!connection.client.url.pathname.startsWith(SOCKET_IO_PATH)) {
      connection.server.connect()
      return
    }

    const scenario = getActiveScenario()
    if (scenario.realtimeOffline) {
      connection.client.close()
      return
    }

    const socket = toSocketIo(connection)
    const subscriber = registerSubscriber(socket)
    const heartbeat = setInterval(() => {
      connection.client.send(ENGINE_IO_PING)
    }, HEARTBEAT_INTERVAL_MS)
    const chaosDisconnect = scenario.realtimeChaos
      ? setTimeout(() => {
          connection.client.close()
        }, CHAOS_DISCONNECT_AFTER_MS)
      : undefined

    socket.client.on(SOCKET_CLIENT_EVENTS.identify, (_event, payload: unknown) => {
      const parsed = identifyPayloadSchema.safeParse(payload)
      const token = parsed.success ? parsed.data.token : null
      subscriber.userId = token ? findActiveSessionUserId(token) : null
    })

    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      clearTimeout(chaosDisconnect)
      unregisterSubscriber(subscriber)
    })

    settlePendingOrders()
  }),
]
