import { delay, HttpResponse } from 'msw'
import { z } from 'zod'
import { isValidWalletAddress } from '@/shared/api/contracts/account'
import {
  createOrderRequestSchema,
  IDEMPOTENCY_KEY_HEADER,
  walletConnectionRequestSchema,
  type Order,
} from '@/shared/api/contracts/commerce'
import { database } from '@/mocks/db/database'
import type {
  CartOwner,
  MockDatabaseState,
  OrderRecord,
  WalletConnectionRecord,
} from '@/mocks/db/records'
import { findQuote } from '@/mocks/domain/cart'
import {
  ORDER_SETTLEMENT_DELAY_MS,
  revalidateQuote,
  toOrder,
  type QuoteRevalidation,
} from '@/mocks/domain/orders'
import { authenticate } from '@/mocks/domain/sessions'
import { getActiveScenario } from '@/mocks/network/scenarios'
import {
  scheduleCheckoutPriceChange,
  scheduleSettlement,
  settlePendingOrders,
} from '@/mocks/realtime/market-events'
import { mockApi, readJson, readPathParam } from './mock-api'
import { apiError, notFound, validationError } from './responses'

const idempotencyKeySchema = z.uuid()

const NETWORK_NAMES = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const

function toConnection(record: WalletConnectionRecord) {
  const { userId, disconnectedAt, ...connection } = record
  return connection
}

function findActiveConnection(state: Readonly<MockDatabaseState>, userId: string, id: string) {
  return state.walletConnections.find(
    (connection) =>
      connection.id === id && connection.userId === userId && connection.disconnectedAt === null,
  )
}

function walletDisconnected() {
  return apiError(
    409,
    'WALLET_DISCONNECTED',
    'A carteira foi desconectada. Conecte novamente para continuar.',
  )
}

function quoteConflict(revalidation: Exclude<QuoteRevalidation, { status: 'valid' }>) {
  const details = { quote: revalidation.quote }
  switch (revalidation.status) {
    case 'price-changed':
      return apiError(409, 'PRICE_CHANGED', 'O preço de um item mudou desde a cotação.', {
        details,
      })
    case 'unavailable':
      return apiError(
        409,
        'AVAILABILITY_CONFLICT',
        'Um item não está mais disponível na quantidade cotada.',
        { details },
      )
    case 'cart-changed':
      return apiError(409, 'QUOTE_EXPIRED', 'Seu carrinho mudou desde a cotação.', { details })
    case 'expired':
      return apiError(409, 'QUOTE_EXPIRED', 'A cotação expirou. Revise os novos valores.', {
        details,
      })
  }
}

type OrderCreation = { order: Order; created: boolean } | Response

function createOrder(
  userId: string,
  idempotencyKey: string,
  request: z.output<typeof createOrderRequestSchema>,
): OrderCreation {
  const fingerprint = JSON.stringify(request)
  const owner: CartOwner = { kind: 'user', userId }

  settlePendingOrders()
  return database.write((state): OrderCreation => {
    const existing = state.orders.find(
      (order) => order.userId === userId && order.idempotencyKey === idempotencyKey,
    )
    if (existing) {
      return existing.requestFingerprint === fingerprint
        ? { order: toOrder(existing), created: false }
        : apiError(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Esta chave de idempotência já foi usada com outros dados.',
          )
    }

    const pending = state.orders.find(
      (order) => order.userId === userId && order.status === 'pending',
    )
    if (pending) {
      return apiError(409, 'CONFLICT', 'Você já tem um pedido em processamento.', {
        details: { orderId: pending.id },
      })
    }

    const connection = findActiveConnection(state, userId, request.connectionId)
    const wallet =
      connection &&
      state.wallets.find(
        (candidate) => candidate.id === connection.walletId && candidate.userId === userId,
      )
    if (!connection || !wallet) {
      return walletDisconnected()
    }

    const stored = findQuote(state, owner, request.quoteId)
    if (!stored) {
      return apiError(409, 'QUOTE_EXPIRED', 'A cotação não existe mais. Atualize os valores.')
    }
    if (stored.network !== connection.network) {
      return apiError(422, 'VALIDATION_ERROR', 'A cotação foi gerada para outra rede.')
    }
    if (stored.lines.length === 0) {
      return apiError(422, 'VALIDATION_ERROR', 'Não há itens disponíveis para comprar.')
    }

    const revalidation = revalidateQuote(state, owner, stored)
    if (revalidation.status !== 'valid') {
      return quoteConflict(revalidation)
    }

    const now = Date.now()
    const timestamp = new Date(now).toISOString()
    const order: OrderRecord = {
      id: `order-${crypto.randomUUID()}`,
      status: 'pending',
      quoteId: stored.id,
      lines: stored.lines,
      subtotal: stored.subtotal,
      discount: stored.discount,
      networkFee: stored.networkFee,
      total: stored.total,
      coupon: stored.coupon,
      wallet: {
        id: wallet.id,
        label: wallet.label,
        provider: connection.provider,
        address: connection.address,
        network: connection.network,
      },
      transactionHash: null,
      explorerUrl: null,
      declineReason: null,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      userId,
      idempotencyKey,
      requestFingerprint: fingerprint,
      collector: request.collector,
      connectionId: connection.id,
      outcome: getActiveScenario().declinePayments ? 'decline' : 'confirm',
      resolveAt: new Date(now + ORDER_SETTLEMENT_DELAY_MS).toISOString(),
    }
    state.orders.push(order)
    scheduleSettlement(order.resolveAt)
    return { order: toOrder(order), created: true }
  })
}

export const checkoutHandlers = [
  mockApi.post('/wallet/connections', async ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const body = walletConnectionRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Dados de conexão inválidos.')
    }
    if (getActiveScenario().rejectWalletConnection) {
      return apiError(403, 'WALLET_REJECTED', 'A conexão foi recusada na carteira.')
    }

    return database.write((state) => {
      const wallet = state.wallets.find(
        (candidate) => candidate.id === body.data.walletId && candidate.userId === context.user.id,
      )
      if (!wallet) {
        return notFound('Carteira não encontrada.')
      }
      if (!isValidWalletAddress(body.data.network, wallet.address)) {
        return apiError(
          422,
          'VALIDATION_ERROR',
          `O endereço desta carteira não é compatível com a rede ${NETWORK_NAMES[body.data.network]}.`,
          { fieldErrors: { network: ['Rede incompatível com o endereço da carteira.'] } },
        )
      }

      const now = new Date().toISOString()
      for (const connection of state.walletConnections) {
        if (connection.userId === context.user.id && connection.disconnectedAt === null) {
          connection.disconnectedAt = now
        }
      }
      const connection: WalletConnectionRecord = {
        id: `connection-${crypto.randomUUID()}`,
        walletId: wallet.id,
        provider: body.data.provider,
        network: body.data.network,
        address: wallet.address,
        connectedAt: now,
        userId: context.user.id,
        disconnectedAt: null,
      }
      state.walletConnections.push(connection)
      if (getActiveScenario().changePriceDuringCheckout) {
        scheduleCheckoutPriceChange(context.user.id)
      }
      return HttpResponse.json(toConnection(connection), { status: 201 })
    })
  }),

  mockApi.delete('/wallet/connections/:connectionId', ({ request, params }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const connectionId = readPathParam(params.connectionId)

    return database.write((state) => {
      const connection = findActiveConnection(state, context.user.id, connectionId)
      if (!connection) {
        return notFound('Conexão não encontrada.')
      }
      connection.disconnectedAt = new Date().toISOString()
      return new HttpResponse(null, { status: 204 })
    })
  }),

  mockApi.post('/orders', async ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const idempotencyKey = idempotencyKeySchema.safeParse(
      request.headers.get(IDEMPOTENCY_KEY_HEADER),
    )
    if (!idempotencyKey.success) {
      return apiError(400, 'VALIDATION_ERROR', 'Envie um cabeçalho Idempotency-Key válido.')
    }
    const body = createOrderRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Revise os dados do colecionador.')
    }

    const result = createOrder(context.user.id, idempotencyKey.data, body.data)
    if (result instanceof Response) {
      return result
    }
    if (result.created && getActiveScenario().dropFirstOrderResponse) {
      await delay('infinite')
    }
    return HttpResponse.json(result.order, { status: result.created ? 201 : 200 })
  }),

  mockApi.get('/orders/active', ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    settlePendingOrders()
    const order = database.read((state) =>
      state.orders.find(
        (candidate) => candidate.userId === context.user.id && candidate.status === 'pending',
      ),
    )
    return HttpResponse.json({ order: order ? toOrder(order) : null })
  }),

  mockApi.get('/orders/:orderId', ({ request, params }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const orderId = readPathParam(params.orderId)
    settlePendingOrders()
    const order = database.read((state) =>
      state.orders.find(
        (candidate) => candidate.id === orderId && candidate.userId === context.user.id,
      ),
    )
    return order ? HttpResponse.json(toOrder(order)) : notFound('Pedido não encontrado.')
  }),
]
