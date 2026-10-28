import { Link } from '@tanstack/react-router'
import { useId, useState } from 'react'
import type { NftSummary } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import { formatEth } from '@/shared/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'
import { NftArtwork } from './nft-artwork'

const PAGE_SIZE = 5

function CarouselCard({ nft }: { nft: NftSummary }) {
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="flex aspect-[219/255] items-center justify-center bg-surface-card px-1">
        <NftArtwork
          artwork={nft.artwork}
          alt={nft.imageAlt}
          sizes="(min-width: 900px) 212px, 45vw"
          className="rounded-[0.8125rem] transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-col">
        <h3 className="text-[0.9375rem] leading-5 text-foreground">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 hover:text-text-accent focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="text-base leading-4 font-bold text-text-accent">
          <span className="sr-only">Preço: </span>
          {formatEth(nft.price)}
        </p>
      </div>
    </article>
  )
}

interface NftCarouselProps {
  title: string
  items: readonly NftSummary[]
  isPending: boolean
}

export function NftCarousel({ title, items, isPending }: NftCarouselProps) {
  const titleId = useId()
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const visible = items.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)

  if (!isPending && items.length === 0) {
    return null
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 id={titleId} className="text-[1.0625rem] leading-4 font-bold text-text-accent">
          {title}
        </h2>
        <div aria-hidden="true" className="h-px bg-primary/40" />
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-[1.625rem]">
        {isPending
          ? Array.from({ length: PAGE_SIZE }, (_, index) => (
              <li key={index}>
                <Skeleton className="aspect-[219/255] w-full rounded-none" />
              </li>
            ))
          : visible.map((nft) => (
              <li key={nft.id}>
                <CarouselCard nft={nft} />
              </li>
            ))}
      </ul>
      {totalPages > 1 && (
        <div role="group" aria-label={`Páginas de ${title}`} className="flex justify-center">
          {Array.from({ length: totalPages }, (_, index) => {
            const isActive = index === currentPage
            return (
              <button
                key={index}
                type="button"
                aria-label={`Página ${index + 1} de ${totalPages}`}
                aria-pressed={isActive}
                className="flex size-6 cursor-pointer items-center justify-center"
                onClick={() => {
                  setPage(index)
                }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-3 rounded-full border-[1.3px] border-primary',
                    isActive && 'bg-primary',
                  )}
                />
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
