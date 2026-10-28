import type { NetworkId } from '@/shared/api/contracts/catalog'
import type { Order, Quote } from '@/shared/api/contracts/commerce'
import { compareEth } from '@/shared/lib/eth'
import { database } from '@/mocks/db/database'
import type { CartOwner, MockDatabaseState, OrderRecord, QuoteRecord } from '@/mocks/db/records'
import {
  buildQuote,
  findCart,
  resolveCoupon,
  resolveEdition,
  storeQuote,
  toCartPayload,
  touchCart,
} from './cart'

export const ORDER_SETTLEMENT_DELAY_MS = 2_500

const EXPLORER_BASE_URLS: Record<NetworkId, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

const DECLINED_BY_WALLET = 'A carteira recusou a assinatura da transação.'
const SOLD_OUT_BEFORE_SETTLEMENT = 'Uma das edições esgotou antes da confirmação na rede.'

export function toOrder(record: OrderRecord): Order {
  const {
    userId,
    idempotencyKey,
    requestFingerprint,
    collector,
    connectionId,
    outcome,
    resolveAt,
    ...order
  } = record
  return order
}

function randomHex(bytes: number) {
  const values = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('')
}

function decline(order: OrderRecord, reason: string) {
  order.status = 'declined'
  order.declineReason = reason
}

function hasStockFor(state: Readonly<MockDatabaseState>, order: OrderRecord) {
  return order.lines.every((line) => {
    const resolved = resolveEdition(state, line.nftId, line.editionKind)
    return resolved !== null && resolved.edition.available >= line.quantity
  })
}

function transferOwnership(state: MockDatabaseState, order: OrderRecord, now: string) {
  for (const line of order.lines) {
    const resolved = resolveEdition(state, line.nftId, line.editionKind)
    if (!resolved) {
      continue
    }
    resolved.edition.available -= line.quantity
    resolved.nft.isAvailable = resolved.nft.editions.some((edition) => edition.available > 0)
    resolved.nft.version += 1
    resolved.nft.updatedAt = now
  }
}

function removePurchasedItems(state: MockDatabaseState, order: OrderRecord) {
  const cart = findCart(state, { kind: 'user', userId: order.userId })
  if (!cart) {
    return
  }
  for (const line of order.lines) {
    const item = cart.items.find(
      (candidate) => candidate.nftId === line.nftId && candidate.editionKind === line.editionKind,
    )
    if (item) {
      item.quantity -= line.quantity
    }
  }
  cart.items = cart.items.filter((item) => item.quantity > 0)
  touchCart(cart)
}

function settleOrder(state: MockDatabaseState, order: OrderRecord, now: number) {
  const timestamp = new Date(now).toISOString()

  if (order.outcome === 'decline') {
    decline(order, DECLINED_BY_WALLET)
  } else if (!hasStockFor(state, order)) {
    decline(order, SOLD_OUT_BEFORE_SETTLEMENT)
  } else {
    transferOwnership(state, order, timestamp)
    removePurchasedItems(state, order)
    const hash = order.wallet.network === 'solana' ? randomHex(32) : `0x${randomHex(32)}`
    order.status = 'confirmed'
    order.transactionHash = hash
    order.explorerUrl = `${EXPLORER_BASE_URLS[order.wallet.network]}${hash}`
  }

  order.version += 1
  order.updatedAt = timestamp
}

export function settleDueOrders(state: MockDatabaseState, now = Date.now()) {
  const due = state.orders
    .filter((order) => order.status === 'pending' && Date.parse(order.resolveAt) <= now)
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))

  for (const order of due) {
    settleOrder(state, order, now)
  }
  return due
}

export function disconnectAllWallets() {
  const now = new Date().toISOString()
  database.write((state) => {
    for (const connection of state.walletConnections) {
      connection.disconnectedAt ??= now
    }
  })
}

export type QuoteRevalidation =
  | { status: 'valid' }
  | { status: 'expired' | 'price-changed' | 'unavailable' | 'cart-changed'; quote: Quote }

export function revalidateQuote(
  state: MockDatabaseState,
  owner: CartOwner,
  stored: QuoteRecord,
  now = Date.now(),
): QuoteRevalidation {
  const cart = toCartPayload(state, findCart(state, owner))
  const coupon = resolveCoupon(stored.coupon?.code ?? null, now)
  const fresh = buildQuote(cart, coupon.status === 'valid' ? coupon.coupon : null, stored.network)

  const status = classifyChange(stored, fresh, cart.version, now)
  if (status === 'valid') {
    return { status }
  }
  storeQuote(state, owner, fresh)
  return { status, quote: fresh }
}

function classifyChange(stored: Quote, fresh: Quote, cartVersion: number, now: number) {
  const priceChanged = stored.lines.some((line) => {
    const current = fresh.lines.find((candidate) => candidate.cartItemId === line.cartItemId)
    return current !== undefined && compareEth(current.unitPrice, line.unitPrice) !== 0
  })
  if (priceChanged) {
    return 'price-changed'
  }

  const unavailable = stored.lines.some((line) => {
    const current = fresh.lines.find((candidate) => candidate.cartItemId === line.cartItemId)
    return current === undefined || current.quantity < line.quantity
  })
  if (unavailable) {
    return 'unavailable'
  }

  if (cartVersion !== stored.cartVersion) {
    return 'cart-changed'
  }
  if (Date.parse(stored.expiresAt) <= now) {
    return 'expired'
  }
  return 'valid'
}
