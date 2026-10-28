import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/shared/ui/skeleton'
import { featuredNftsQueryOptions } from '../api/catalog-queries'
import { NftArtwork } from './nft-artwork'

export function FeaturedSpotlight() {
  const { data, isPending, isError } = useQuery(featuredNftsQueryOptions())

  if (isError) {
    return null
  }

  return (
    <section
      aria-labelledby="destaque-titulo"
      className="relative flex h-[29.375rem] w-[19.375rem] flex-col gap-4 overflow-hidden bg-primary/10 pt-6 pb-1"
    >
      <div className="relative flex flex-col gap-4">
        <h2
          id="destaque-titulo"
          className="px-5 text-2xl leading-8 font-bold text-text-accent uppercase"
        >
          NFT em destaque
        </h2>
        <p className="px-5 text-center text-[1.375rem] leading-4 font-bold text-foreground uppercase">
          Oferta limitada
        </p>
      </div>
      {isPending ? (
        <Skeleton className="h-[23rem] w-full rounded-[1.375rem]" />
      ) : (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: data.spotlight.id }}
          aria-label={`Ver ${data.spotlight.name}, NFT em destaque`}
          className="relative block h-[23rem] overflow-hidden rounded-[1.375rem]"
        >
          <NftArtwork
            artwork={data.spotlight.artwork}
            alt={data.spotlight.imageAlt}
            sizes="310px"
            className="h-full object-cover"
          />
        </Link>
      )}
    </section>
  )
}
