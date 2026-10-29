import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { editionKindSchema } from '@/shared/api/contracts/catalog'
import { getErrorMessage, hasErrorCode } from '@/shared/api/api-error'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { nftDetailQueryOptions } from '@/features/catalog/api/catalog-queries'
import { CatalogMessage } from '@/features/catalog/components/nft-grid'
import { NftDetailView } from '@/features/nft-detail/components/nft-detail-view'

const detailSearchSchema = z.object({
  edicao: editionKindSchema.optional().catch(undefined),
})

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: detailSearchSchema,
  component: NftDetailPage,
})

function NftDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT" className="flex flex-col gap-3 lg:min-h-dvh">
      <Skeleton className="hidden h-4 w-36 lg:block" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="hidden gap-7 lg:flex">
          <div className="flex w-[6.25rem] flex-col gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="size-[6.25rem] rounded-lg" />
            ))}
          </div>
          <Skeleton className="size-[27.75rem] rounded-md" />
        </div>
        <Skeleton className="aspect-[361/356] w-full rounded-3xl lg:hidden" />
        <div className="flex flex-1 flex-col gap-6">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-2/3" />
        </div>
      </div>
    </div>
  )
}

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { edicao } = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery(nftDetailQueryOptions(nftId))

  if (query.isPending) {
    return <NftDetailSkeleton />
  }

  if (query.isError) {
    const isMissing = hasErrorCode(query.error, 'NOT_FOUND')
    return (
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
    )
  }

  return (
    <NftDetailView
      key={query.data.id}
      nft={query.data}
      requestedEdition={edicao}
      onSelectEdition={(kind) => {
        void navigate({
          search: { edicao: kind === query.data.defaultEdition ? undefined : kind },
          replace: true,
          resetScroll: false,
        })
      }}
    />
  )
}
