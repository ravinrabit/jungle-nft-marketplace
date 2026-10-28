import type { Edition, EditionKind, NetworkId } from '@/shared/api/contracts/catalog'
import type {
  Cart,
  CartAdjustment,
  CartItem,
  Coupon,
  Quote,
  QuoteIssue,
  QuoteLine,
} from '@/shared/api/contracts/commerce'
import { compareEth, isZeroEth, multiplyEth, subtractEth, sumEth } from '@/shared/lib/eth'
import {
  COUPON_FIXTURES,
  DEFAULT_QUOTE_NETWORK,
  NETWORK_FEES,
  QUOTE_TTL_MS,
  type CouponFixture,
} from '@/mocks/db/fixtures/commerce-fixtures'
import type {
  CartItemRecord,
  CartOwner,
  CartRecord,
  MockDatabaseState,
  NftRecord,
} from '@/mocks/db/records'

export function ownerKey(owner: CartOwner) {
  return owner.kind === 'user' ? `user:${owner.userId}` : `guest:${owner.guestId}`
}

function sameOwner(left: CartOwner, right: CartOwner) {
  return ownerKey(left) === ownerKey(right)
}

export function findCart(state: Readonly<MockDatabaseState>, owner: CartOwner) {
  return state.carts.find((cart) => sameOwner(cart.owner, owner))
}

export function findOrCreateCart(state: MockDatabaseState, owner: CartOwner) {
  const existing = findCart(state, owner)
  if (existing) {
    return existing
  }
  const cart: CartRecord = {
    id: `cart-${crypto.randomUUID()}`,
    owner,
    items: [],
    version: 0,
    updatedAt: new Date().toISOString(),
  }
  state.carts.push(cart)
  return cart
}

export function touchCart(cart: CartRecord) {
  cart.version += 1
  cart.updatedAt = new Date().toISOString()
}

export interface ResolvedEdition {
  nft: NftRecord
  edition: Edition
  limit: number
}

export function resolveEdition(
  state: Readonly<MockDatabaseState>,
  nftId: string,
  editionKind: EditionKind,
): ResolvedEdition | null {
  const nft = state.nfts.find((candidate) => candidate.id === nftId)
  const edition = nft?.editions.find((candidate) => candidate.kind === editionKind)
  if (!nft || !edition) {
    return null
  }
  return { nft, edition, limit: Math.min(edition.available, edition.maxPerOrder) }
}

function toCartItem(item: CartItemRecord, resolved: ResolvedEdition): CartItem {
  const unitPrice = resolved.edition.price
  return {
    id: item.id,
    nftId: item.nftId,
    editionKind: item.editionKind,
    quantity: item.quantity,
    unitPrice,
    lineTotal: multiplyEth(unitPrice, item.quantity),
    name: resolved.nft.name,
    tokenId: resolved.nft.tokenId,
    artwork: resolved.nft.artwork,
    imageAlt: resolved.nft.imageAlt,
    available: resolved.edition.available,
    maxPerOrder: resolved.edition.maxPerOrder,
    nftVersion: resolved.nft.version,
    priceChangedFrom: compareEth(item.addedUnitPrice, unitPrice) === 0 ? null : item.addedUnitPrice,
  }
}

export function emptyCart(): Cart {
  return {
    items: [],
    itemCount: 0,
    subtotal: '0',
    version: 0,
    updatedAt: new Date(0).toISOString(),
    adjustments: [],
  }
}

export function toCartPayload(
  state: Readonly<MockDatabaseState>,
  cart: CartRecord | undefined,
  adjustments: CartAdjustment[] = [],
): Cart {
  if (!cart) {
    return emptyCart()
  }

  const items = cart.items.flatMap((item) => {
    const resolved = resolveEdition(state, item.nftId, item.editionKind)
    return resolved ? [toCartItem(item, resolved)] : []
  })

  return {
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: sumEth(items.map((item) => item.lineTotal)),
    version: cart.version,
    updatedAt: cart.updatedAt,
    adjustments,
  }
}

export function mergeCarts(state: MockDatabaseState, source: CartRecord, target: CartRecord) {
  const adjustments: CartAdjustment[] = []

  for (const incoming of source.items) {
    const resolved = resolveEdition(state, incoming.nftId, incoming.editionKind)
    if (!resolved) {
      continue
    }

    const existing = target.items.find(
      (item) => item.nftId === incoming.nftId && item.editionKind === incoming.editionKind,
    )
    const requested = (existing?.quantity ?? 0) + incoming.quantity
    const applied = Math.min(requested, resolved.limit)

    if (applied < requested) {
      adjustments.push({
        cartItemId: existing?.id ?? incoming.id,
        name: resolved.nft.name,
        requestedQuantity: requested,
        appliedQuantity: applied,
      })
    }

    if (existing) {
      existing.quantity = Math.max(applied, existing.quantity)
    } else if (applied > 0) {
      target.items.push({ ...incoming, quantity: applied })
    }
  }

  state.carts = state.carts.filter((cart) => cart.id !== source.id)
  touchCart(target)
  return adjustments
}

export type CouponResolution =
  | { status: 'none' }
  | { status: 'valid'; coupon: CouponFixture }
  | { status: 'invalid' }
  | { status: 'expired' }

export function resolveCoupon(code: string | null, now = Date.now()): CouponResolution {
  if (!code) {
    return { status: 'none' }
  }
  const coupon = COUPON_FIXTURES.find((candidate) => candidate.code === code)
  if (!coupon) {
    return { status: 'invalid' }
  }
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= now) {
    return { status: 'expired' }
  }
  return { status: 'valid', coupon }
}

function couponDiscount(coupon: CouponFixture, subtotal: string) {
  const raw =
    coupon.rule.kind === 'percent' ? multiplyEth(subtotal, coupon.rule.percent) : coupon.rule.amount
  return compareEth(raw, subtotal) > 0 ? subtotal : raw
}

function collectIssues(item: CartItem, limit: number): QuoteIssue[] {
  const base = {
    cartItemId: item.id,
    nftId: item.nftId,
    editionKind: item.editionKind,
    requestedQuantity: item.quantity,
    availableQuantity: limit,
  }
  const issues: QuoteIssue[] = []

  if (limit === 0) {
    issues.push({ ...base, type: 'UNAVAILABLE', previousUnitPrice: null, currentUnitPrice: null })
  } else if (item.quantity > limit) {
    issues.push({
      ...base,
      type: 'AVAILABILITY_REDUCED',
      previousUnitPrice: null,
      currentUnitPrice: null,
    })
  }

  if (item.priceChangedFrom) {
    issues.push({
      ...base,
      type: 'PRICE_CHANGED',
      previousUnitPrice: item.priceChangedFrom,
      currentUnitPrice: item.unitPrice,
    })
  }

  return issues
}

const MAX_STORED_QUOTES_PER_OWNER = 5

export function storeQuote(state: MockDatabaseState, owner: CartOwner, quote: Quote) {
  const key = ownerKey(owner)
  const previous = state.quotes.filter((stored) => stored.ownerKey === key)
  const keep = new Set(previous.slice(-MAX_STORED_QUOTES_PER_OWNER + 1).map(({ id }) => id))
  state.quotes = state.quotes.filter((stored) => stored.ownerKey !== key || keep.has(stored.id))
  state.quotes.push({ ...quote, ownerKey: key })
}

export function findQuote(state: Readonly<MockDatabaseState>, owner: CartOwner, quoteId: string) {
  const key = ownerKey(owner)
  return state.quotes.find((quote) => quote.id === quoteId && quote.ownerKey === key)
}

export function buildQuote(
  cart: Cart,
  coupon: CouponFixture | null,
  network: NetworkId | null,
): Quote {
  const lines: QuoteLine[] = []
  const issues: QuoteIssue[] = []

  for (const item of cart.items) {
    const limit = Math.min(item.available, item.maxPerOrder)
    issues.push(...collectIssues(item, limit))
    const quantity = Math.min(item.quantity, limit)
    if (quantity > 0) {
      lines.push({
        cartItemId: item.id,
        nftId: item.nftId,
        editionKind: item.editionKind,
        quantity,
        unitPrice: item.unitPrice,
        lineTotal: multiplyEth(item.unitPrice, quantity),
        name: item.name,
        tokenId: item.tokenId,
        artwork: item.artwork,
        imageAlt: item.imageAlt,
      })
    }
  }

  const subtotal = sumEth(lines.map((line) => line.lineTotal))
  const discount = coupon && !isZeroEth(subtotal) ? couponDiscount(coupon, subtotal) : '0'
  const resolvedNetwork = network ?? DEFAULT_QUOTE_NETWORK
  const networkFee = lines.length > 0 ? NETWORK_FEES[resolvedNetwork] : '0'
  const now = Date.now()
  const appliedCoupon: Coupon | null = coupon
    ? { code: coupon.code, description: coupon.description }
    : null

  return {
    id: `quote-${crypto.randomUUID()}`,
    lines,
    subtotal,
    discount,
    networkFee,
    total: sumEth([subtractEth(subtotal, discount), networkFee]),
    coupon: appliedCoupon,
    network: resolvedNetwork,
    issues,
    cartVersion: cart.version,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }
}
