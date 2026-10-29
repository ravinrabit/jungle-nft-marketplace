import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { getErrorMessage } from '@/shared/api/api-error'
import { Button } from '@/shared/ui/button'
import { CatalogMessage, NftGrid, NftGridSkeleton } from '@/features/catalog/components/nft-grid'
import { favoriteNftsQueryOptions } from '../api/cart-queries'

const SKELETON_COUNT = 3

export function FavoriteNftsPanel({ userId }: { userId: string }) {
  const query = useQuery(favoriteNftsQueryOptions(userId))

  return (
    <section aria-labelledby="lista-de-interesse" className="flex min-w-0 flex-1 flex-col gap-6">
      <h1 id="lista-de-interesse" className="text-[1.0625rem] leading-4 font-bold text-foreground">
        Lista de interesse
      </h1>
      {query.isPending ? (
        <div aria-busy="true" aria-label="Carregando lista de interesse">
          <NftGridSkeleton count={SKELETON_COUNT} />
        </div>
      ) : query.isError ? (
        <CatalogMessage
          tone="error"
          title="Não foi possível carregar sua lista de interesse"
          description={getErrorMessage(query.error)}
          action={<Button onClick={() => void query.refetch()}>Tentar novamente</Button>}
        />
      ) : query.data.items.length === 0 ? (
        <CatalogMessage
          title="Sua lista de interesse está vazia"
          description="Toque no coração de um NFT para acompanhá-lo aqui."
          action={
            <Button asChild>
              <Link to="/" hash="catalogo">
                Explorar NFTs
              </Link>
            </Button>
          }
        />
      ) : (
        <NftGrid items={query.data.items} isRefreshing={false} label="NFTs favoritos" />
      )}
    </section>
  )
}
