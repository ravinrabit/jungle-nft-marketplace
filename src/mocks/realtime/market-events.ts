import type { EditionKind } from '@/shared/api/contracts/catalog'
import { sumEth } from '@/shared/lib/eth'
import { database } from '@/mocks/db/database'
import type { OrderRecord } from '@/mocks/db/records'
import { findCart } from '@/mocks/domain/cart'
import { changeEditionAvailability, changeEditionPrice } from '@/mocks/domain/catalog-changes'
import { settleDueOrders } from '@/mocks/domain/orders'
import { publishNftUpdate, publishOrderUpdate } from './realtime-hub'

const SETTLEMENT_MARGIN_MS = 20
const CHECKOUT_PRICE_CHANGE_DELAY_MS = 1_500
const CHECKOUT_PRICE_INCREMENT = '0.05'

export function updateEditionPrice(nftId: string, editionKind: EditionKind, price: string) {
  const nft = changeEditionPrice(nftId, editionKind, price)
  if (nft) {
    publishNftUpdate(nft)
  }
  return nft !== null
}

export function updateEditionAvailability(
  nftId: string,
  editionKind: EditionKind,
  available: number,
) {
  const nft = changeEditionAvailability(nftId, editionKind, available)
  if (nft) {
    publishNftUpdate(nft)
  }
  return nft !== null
}

function publishSettlements(orders: readonly OrderRecord[]) {
  const purchasedIds = new Set(
    orders
      .filter((order) => order.status === 'confirmed')
      .flatMap((order) => order.lines.map((line) => line.nftId)),
  )
  const nfts = database.read((state) => state.nfts.filter((nft) => purchasedIds.has(nft.id)))
  for (const nft of nfts) {
    publishNftUpdate(nft)
  }
  for (const order of orders) {
    publishOrderUpdate(order)
  }
}

export function settlePendingOrders() {
  const settled = database.write((state) => settleDueOrders(state))
  publishSettlements(settled)
}

export function scheduleSettlement(resolveAt: string) {
  const delay = Math.max(0, Date.parse(resolveAt) - Date.now()) + SETTLEMENT_MARGIN_MS
  setTimeout(settlePendingOrders, delay)
}

export function schedulePendingSettlements() {
  const pending = database.read((state) =>
    state.orders.filter((order) => order.status === 'pending').map((order) => order.resolveAt),
  )
  for (const resolveAt of pending) {
    scheduleSettlement(resolveAt)
  }
}

export function scheduleCheckoutPriceChange(userId: string) {
  setTimeout(() => {
    const target = database.read((state) => {
      const item = findCart(state, { kind: 'user', userId })?.items[0]
      const edition =
        item &&
        state.nfts
          .find((nft) => nft.id === item.nftId)
          ?.editions.find((candidate) => candidate.kind === item.editionKind)
      return item && edition ? { item, price: edition.price } : null
    })
    if (target) {
      updateEditionPrice(
        target.item.nftId,
        target.item.editionKind,
        sumEth([target.price, CHECKOUT_PRICE_INCREMENT]),
      )
    }
  }, CHECKOUT_PRICE_CHANGE_DELAY_MS)
}
