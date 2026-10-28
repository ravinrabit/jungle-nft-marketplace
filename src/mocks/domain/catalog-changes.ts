import type { Edition, EditionKind } from '@/shared/api/contracts/catalog'
import { isEthAmount } from '@/shared/lib/eth'
import { database } from '@/mocks/db/database'
import type { NftRecord } from '@/mocks/db/records'

function changeEdition(
  nftId: string,
  editionKind: EditionKind,
  change: (nft: NftRecord, edition: Edition) => void,
) {
  return database.write((state) => {
    const nft = state.nfts.find((candidate) => candidate.id === nftId)
    const edition = nft?.editions.find((candidate) => candidate.kind === editionKind)
    if (!nft || !edition) {
      return null
    }
    change(nft, edition)
    nft.isAvailable = nft.editions.some((candidate) => candidate.available > 0)
    nft.version += 1
    nft.updatedAt = new Date().toISOString()
    return nft
  })
}

export function changeEditionPrice(nftId: string, editionKind: EditionKind, price: string) {
  if (!isEthAmount(price)) {
    return null
  }
  return changeEdition(nftId, editionKind, (nft, edition) => {
    edition.price = price
    if (editionKind === nft.defaultEdition) {
      nft.price = price
    }
  })
}

export function changeEditionAvailability(
  nftId: string,
  editionKind: EditionKind,
  available: number,
) {
  if (!Number.isInteger(available) || available < 0) {
    return null
  }
  return changeEdition(nftId, editionKind, (_nft, edition) => {
    edition.available = edition.supply === null ? available : Math.min(available, edition.supply)
  })
}
