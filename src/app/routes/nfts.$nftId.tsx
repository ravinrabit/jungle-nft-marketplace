import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { hasErrorCode, getErrorMessage } from '@/shared/api/api-error'
import { formatEth } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { nftDetailQueryOptions } from '@/features/catalog/api/catalog-queries'
import { NftArtwork } from '@/features/catalog/components/nft-artwork'
import { CatalogMessage } from '@/features/catalog/components/nft-grid'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const query = useQuery(nftDetailQueryOptions(nftId))

  if (query.isPending) {
    return (
      <div className="grid gap-8 py-12 md:grid-cols-2" aria-busy="true">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (query.isError) {
    const isMissing = hasErrorCode(query.error, 'NOT_FOUND')
    return (
      <div className="py-12">
        <CatalogMessage
          tone={isMissing ? 'neutral' : 'error'}
          title={isMissing ? 'NFT não encontrado' : 'Não foi possível carregar o NFT'}
          description={
            isMissing
              ? 'Este NFT não existe ou foi removido do catálogo.'
              : getErrorMessage(query.error)
          }
          action={
            isMissing ? (
              <Button asChild>
                <Link to="/">Voltar ao catálogo</Link>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  void query.refetch()
                }}
              >
                Tentar novamente
              </Button>
            )
          }
        />
      </div>
    )
  }

  const nft = query.data

  return (
    <article className="grid gap-8 py-12 md:grid-cols-2">
      <NftArtwork
        artwork={nft.artwork}
        alt={nft.imageAlt}
        sizes="(min-width: 768px) 45vw, 100vw"
        priority
        className="rounded-lg"
      />
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{nft.name}</h1>
        <p className="text-xl font-bold text-text-accent">{formatEth(nft.price)}</p>
        <p className="text-sm leading-6 text-text-secondary">{nft.description}</p>
      </div>
    </article>
  )
}
