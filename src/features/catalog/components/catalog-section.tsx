import { useEffect } from 'react'
import type { NftListResponse } from '@/shared/api/contracts/catalog'
import { getErrorMessage } from '@/shared/api/api-error'
import { Button } from '@/shared/ui/button'
import { hasActiveFilters, useCatalogSearch } from '../use-catalog-search'
import { CatalogFilters } from './catalog-filters'
import { CatalogPagination } from './catalog-pagination'
import { CatalogSortSelect, CatalogTabs } from './catalog-toolbar'
import { FeaturedSpotlight } from './featured-spotlight'
import { CatalogMessage, NftGrid, NftGridSkeleton } from './nft-grid'

function describeResults(data: NftListResponse | undefined, isFetching: boolean) {
  if (!data) {
    return isFetching ? 'Carregando NFTs' : ''
  }
  if (data.totalItems === 0) {
    return 'Nenhum NFT encontrado'
  }
  const noun = data.totalItems === 1 ? 'NFT encontrado' : 'NFTs encontrados'
  return `${data.totalItems} ${noun}, página ${data.page} de ${data.totalPages}`
}

export function CatalogSection() {
  const { search, query, updateSearch, goToPage, clearFilters } = useCatalogSearch()
  const { data } = query

  const currentPage = search.page ?? 1
  const lastPage = data?.totalPages ?? 0

  useEffect(() => {
    if (!query.isPlaceholderData && lastPage > 0 && currentPage > lastPage) {
      goToPage(lastPage)
    }
  }, [currentPage, lastPage, goToPage, query.isPlaceholderData])

  return (
    <section
      id="catalogo"
      aria-labelledby="catalogo-titulo"
      className="flex scroll-mt-6 flex-col gap-4 lg:flex-row lg:items-start lg:gap-12"
    >
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>

      <aside aria-label="Filtros do catálogo" className="hidden shrink-0 flex-col gap-6 lg:flex">
        <CatalogFilters
          search={search}
          facets={data?.facets}
          className="w-[19.375rem]"
          onChange={(change) => {
            updateSearch(change)
          }}
        />
        <FeaturedSpotlight />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-[5.5rem]">
        <div className="flex flex-col gap-4 lg:gap-8">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <CatalogTabs
              tab={search.tab ?? 'all'}
              onTabChange={(tab) => {
                updateSearch({ tab: tab === 'all' ? undefined : tab })
              }}
            />
            <CatalogSortSelect
              className="hidden lg:flex"
              sort={search.sort ?? 'recent'}
              onSortChange={(sort) => {
                updateSearch({ sort: sort === 'recent' ? undefined : sort })
              }}
            />
          </div>

          <p aria-live="polite" className="sr-only">
            {describeResults(data, query.isFetching)}
          </p>

          <CatalogResults
            data={data}
            isPending={query.isPending}
            isRefreshing={query.isPlaceholderData}
            error={query.isError ? query.error : null}
            onRetry={() => {
              void query.refetch()
            }}
            onClearFilters={hasActiveFilters(search) ? clearFilters : undefined}
          />
        </div>

        {data && <CatalogPagination page={data.page} totalPages={data.totalPages} />}
      </div>
    </section>
  )
}

interface CatalogResultsProps {
  data: NftListResponse | undefined
  isPending: boolean
  isRefreshing: boolean
  error: unknown
  onRetry: () => void
  onClearFilters: (() => void) | undefined
}

function CatalogResults({
  data,
  isPending,
  isRefreshing,
  error,
  onRetry,
  onClearFilters,
}: CatalogResultsProps) {
  if (error && !data) {
    return (
      <CatalogMessage
        tone="error"
        title="Não foi possível carregar o catálogo"
        description={getErrorMessage(error)}
        action={<Button onClick={onRetry}>Tentar novamente</Button>}
      />
    )
  }

  if (isPending || !data) {
    return <NftGridSkeleton />
  }

  if (data.items.length === 0) {
    return (
      <CatalogMessage
        title="Nenhum NFT encontrado"
        description="Ajuste a busca ou remova alguns filtros para ver mais resultados."
        action={
          onClearFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          )
        }
      />
    )
  }

  return <NftGrid items={data.items} isRefreshing={isRefreshing} />
}
