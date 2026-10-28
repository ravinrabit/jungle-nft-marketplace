import { Link } from '@tanstack/react-router'
import { Heart, Search, ShoppingCart } from 'lucide-react'
import type { NftSummary } from '@/shared/api/contracts/catalog'
import { formatEth } from '@/shared/lib/eth'
import { notifyUnavailableFeature } from '@/shared/lib/unavailable-feature'
import { RARITY_LABELS } from '../catalog-labels'
import { NftArtwork } from './nft-artwork'

const CARD_IMAGE_SIZES =
  '(min-width: 1280px) 250px, (min-width: 1024px) 30vw, (min-width: 768px) 30vw, 45vw'

const ROUND_ACTION =
  'flex size-7 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-primary transition-colors hover:bg-primary hover:text-ink'

interface NftCardProps {
  nft: NftSummary
  priority?: boolean
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  const rarityLabel = RARITY_LABELS[nft.rarity]

  return (
    <article className="group relative flex flex-col gap-2 lg:gap-3">
      <div className="relative flex aspect-[175/200] items-center justify-center overflow-hidden rounded-[1.25rem] bg-linear-to-b from-surface-card to-surface-raised px-1 lg:aspect-[258/300] lg:rounded-none lg:bg-surface-card lg:bg-none">
        <NftArtwork
          artwork={nft.artwork}
          alt={nft.imageAlt}
          sizes={CARD_IMAGE_SIZES}
          priority={priority}
          className="w-[96%] rounded-2xl lg:w-[96.9%] lg:rounded-[0.9375rem]"
        />
        {rarityLabel && (
          <span className="absolute top-0 left-0 flex h-8 w-[4.25rem] items-center justify-center bg-primary text-[0.8125rem] leading-4 font-medium text-ink uppercase lg:top-1 lg:left-1">
            {rarityLabel}
          </span>
        )}
        {!nft.isAvailable && (
          <span className="absolute bottom-3 left-3 bg-ink/85 px-3 py-1 text-xs font-bold text-foreground uppercase">
            Esgotado
          </span>
        )}
        <button
          type="button"
          aria-label={`Favoritar ${nft.name}`}
          className={`${ROUND_ACTION} absolute top-3 right-3 z-10 lg:hidden`}
          onClick={() => {
            notifyUnavailableFeature('Favoritar')
          }}
        >
          <Heart aria-hidden="true" className="size-[0.9375rem]" />
        </button>
        <div className="absolute right-4 bottom-4 z-10 hidden gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 lg:flex">
          <button
            type="button"
            aria-label={`Adicionar ${nft.name} ao carrinho`}
            className={ROUND_ACTION}
            onClick={() => {
              notifyUnavailableFeature('O carrinho')
            }}
          >
            <ShoppingCart aria-hidden="true" className="size-[0.9375rem]" />
          </button>
          <button
            type="button"
            aria-label={`Favoritar ${nft.name}`}
            className={ROUND_ACTION}
            onClick={() => {
              notifyUnavailableFeature('Favoritar')
            }}
          >
            <Heart aria-hidden="true" className="size-[0.9375rem]" />
          </button>
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            aria-label={`Ver detalhes de ${nft.name}`}
            tabIndex={-1}
            className={ROUND_ACTION}
          >
            <Search aria-hidden="true" className="size-[0.9375rem]" />
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-0 pl-2 lg:gap-1.5 lg:pl-0">
        <h3 className="text-[0.9375rem] leading-5 font-normal text-foreground lg:text-base lg:leading-4">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 hover:text-text-accent focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="flex items-baseline gap-3 text-base leading-4 font-bold text-text-accent lg:text-lg">
          <span>
            <span className="sr-only">Preço: </span>
            {formatEth(nft.price)}
          </span>
          {nft.compareAtPrice && (
            <span className="font-normal text-price-muted line-through">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.compareAtPrice)}
            </span>
          )}
        </p>
      </div>
    </article>
  )
}
