import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/shared/api/contracts/catalog'
import { formatEth } from '@/shared/lib/eth'
import { RARITY_LABELS } from '../catalog-labels'
import { NftArtwork } from './nft-artwork'

const CARD_IMAGE_SIZES = '(min-width: 1280px) 250px, (min-width: 768px) 30vw, 45vw'

interface NftCardProps {
  nft: NftSummary
  priority?: boolean
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  const rarityLabel = RARITY_LABELS[nft.rarity]

  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative overflow-hidden bg-surface-card p-1">
        <NftArtwork
          artwork={nft.artwork}
          alt={nft.imageAlt}
          sizes={CARD_IMAGE_SIZES}
          priority={priority}
          className="rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {rarityLabel && (
          <span className="absolute top-1 left-1 bg-primary px-3 py-1 text-xs font-bold text-ink uppercase">
            {rarityLabel}
          </span>
        )}
        {!nft.isAvailable && (
          <span className="absolute right-1 bottom-1 bg-ink/85 px-3 py-1 text-xs font-bold text-foreground uppercase">
            Esgotado
          </span>
        )}
      </div>
      <h3 className="text-base leading-4">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          className="after:absolute after:inset-0 hover:text-text-accent focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring"
        >
          {nft.name}
        </Link>
      </h3>
      <p className="flex items-baseline gap-2 text-lg leading-4 font-bold text-text-accent">
        <span>
          <span className="sr-only">Preço: </span>
          {formatEth(nft.price)}
        </span>
        {nft.compareAtPrice && (
          <span className="text-base font-normal text-price-muted line-through">
            <span className="sr-only">Preço anterior: </span>
            {formatEth(nft.compareAtPrice)}
          </span>
        )}
      </p>
    </article>
  )
}
