import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { NftSummary } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import { formatEth } from '@/shared/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'
import { relatedNftsQueryOptions } from '@/features/catalog/api/catalog-queries'
import { NftArtwork } from '@/features/catalog/components/nft-artwork'

const PAGE_SIZE = 5

function RelatedCard({ nft }: { nft: NftSummary }) {
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="flex aspect-[219/255] items-center justify-center bg-surface-card px-1">
        <NftArtwork
          artwork={nft.artwork}
          alt={nft.imageAlt}
          sizes="(min-width: 1024px) 212px, 45vw"
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

export function RelatedNfts({ nftId }: { nftId: string }) {
  const { data, isPending, isError } = useQuery(relatedNftsQueryOptions(nftId))
  const [page, setPage] = useState(0)

  if (isError || data?.items.length === 0) {
    return null
  }

  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const visible = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2
          id="relacionados-titulo"
          className="text-[1.0625rem] leading-4 font-bold text-text-accent"
        >
          Mais desta coleção
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
                <RelatedCard nft={nft} />
              </li>
            ))}
      </ul>
      {totalPages > 1 && (
        <div role="group" aria-label="Páginas de NFTs relacionados" className="flex justify-center">
          {Array.from({ length: totalPages }, (_, index) => {
            const isActive = index === page
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
