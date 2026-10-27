import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import type { NftListResponse } from '@/shared/api/contracts/catalog'
import { getErrorMessage } from '@/shared/api/api-error'
import { Button } from '@/shared/ui/button'
import { nftListQueryOptions } from '../api/catalog-queries'
import { toNftListParams, withFilterChange, type CatalogSearch } from '../catalog-search'
import { CatalogFilters } from './catalog-filters'
import { CatalogPagination } from './catalog-pagination'
import { CatalogSearchField } from './catalog-search-field'
import { CatalogToolbar } from './catalog-toolbar'
import { CatalogMessage, NftGrid, NftGridSkeleton } from './nft-grid'

const routeApi = getRouteApi('/')

type SearchChange = Partial<Omit<CatalogSearch, 'page'>>

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

function hasActiveFilters(search: CatalogSearch) {
  return Boolean(
    search.q ??
    search.categories ??
    search.networks ??
    search.minPrice ??
    search.maxPrice ??
    search.tab,
  )
}

export function CatalogSection() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const params = toNftListParams(search)
  const query = useQuery(nftListQueryOptions(params))
  const { data } = query

  const updateSearch = useCallback(
    (change: SearchChange, replace = false) => {
      void navigate({
        search: (previous) => withFilterChange(previous, change),
        replace,
        resetScroll: false,
      })
    },
    [navigate],
  )

  const handleSearch = useCallback(
    (q: string | undefined) => {
      updateSearch({ q }, true)
    },
    [updateSearch],
  )

  const clearFilters = useCallback(() => {
    void navigate({ search: {}, resetScroll: false })
  }, [navigate])

  const currentPage = search.page ?? 1
  const lastPage = data?.totalPages ?? 0

  useEffect(() => {
    if (!query.isPlaceholderData && lastPage > 0 && currentPage > lastPage) {
      void navigate({
        search: (previous) => ({ ...previous, page: lastPage > 1 ? lastPage : undefined }),
        replace: true,
        resetScroll: false,
      })
    }
  }, [currentPage, lastPage, navigate, query.isPlaceholderData])

  const filters = (
    <CatalogFilters
      search={search}
      facets={data?.facets}
      onChange={(change) => {
        updateSearch(change)
      }}
    />
  )

  return (
    <section aria-labelledby="catalogo-titulo" className="flex flex-col gap-6">
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>

      <CatalogSearchField value={search.q} onSearch={handleSearch} />

      <div className="grid gap-8 lg:grid-cols-[19.375rem_1fr]">
        <aside aria-label="Filtros do catálogo" className="hidden lg:block">
          {filters}
        </aside>

        <details className="group bg-surface-card lg:hidden">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-5 font-medium">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Filtros
          </summary>
          {filters}
        </details>

        <div className="flex min-w-0 flex-col gap-8">
          <CatalogToolbar
            tab={search.tab ?? 'all'}
            sort={search.sort ?? 'recent'}
            onTabChange={(tab) => {
              updateSearch({ tab: tab === 'all' ? undefined : tab })
            }}
            onSortChange={(sort) => {
              updateSearch({ sort: sort === 'recent' ? undefined : sort })
            }}
          />

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

          {data && <CatalogPagination page={data.page} totalPages={data.totalPages} />}
        </div>
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
