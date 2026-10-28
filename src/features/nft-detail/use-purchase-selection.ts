import { useState } from 'react'
import type { Edition, EditionKind, NftDetail } from '@/shared/api/contracts/catalog'

function findEdition(nft: NftDetail, kind: EditionKind | undefined) {
  return kind ? nft.editions.find((edition) => edition.kind === kind) : undefined
}

function pickInitialEdition(nft: NftDetail, requested: EditionKind | undefined): Edition {
  const firstEdition = nft.editions[0]
  if (!firstEdition) {
    throw new Error(`O NFT ${nft.id} não possui edições`)
  }
  return (
    findEdition(nft, requested) ??
    findEdition(nft, nft.defaultEdition) ??
    nft.editions.find((edition) => edition.available > 0) ??
    firstEdition
  )
}

export function maxPurchasableQuantity(edition: Edition) {
  return Math.min(edition.available, edition.maxPerOrder)
}

export function usePurchaseSelection(nft: NftDetail, requestedEdition: EditionKind | undefined) {
  const edition = pickInitialEdition(nft, requestedEdition)
  const maxQuantity = maxPurchasableQuantity(edition)
  const [requestedQuantity, setQuantity] = useState(1)
  const quantity = Math.max(1, Math.min(requestedQuantity, Math.max(maxQuantity, 1)))

  return {
    edition,
    quantity,
    maxQuantity,
    isAvailable: maxQuantity > 0,
    setQuantity,
  }
}
