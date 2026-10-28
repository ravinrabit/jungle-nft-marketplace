import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useCallback } from 'react'
import { nftListQueryOptions } from './api/catalog-queries'
import { toNftListParams, withFilterChange, type CatalogSearch } from './catalog-search'

const routeApi = getRouteApi('/')

export type CatalogSearchChange = Partial<Omit<CatalogSearch, 'page'>>

export function useCatalogSearch() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const query = useQuery(nftListQueryOptions(toNftListParams(search)))

  const updateSearch = useCallback(
    (change: CatalogSearchChange, options: { replace?: boolean } = {}) => {
      void navigate({
        search: (previous) => withFilterChange(previous, change),
        replace: options.replace ?? false,
        resetScroll: false,
      })
    },
    [navigate],
  )

  const goToPage = useCallback(
    (page: number) => {
      void navigate({
        search: (previous) => ({ ...previous, page: page > 1 ? page : undefined }),
        replace: true,
        resetScroll: false,
      })
    },
    [navigate],
  )

  const clearFilters = useCallback(() => {
    void navigate({ search: {}, resetScroll: false })
  }, [navigate])

  return { search, query, updateSearch, goToPage, clearFilters }
}

export function hasActiveFilters(search: CatalogSearch) {
  return Boolean(
    search.q ??
    search.categories ??
    search.networks ??
    search.minPrice ??
    search.maxPrice ??
    search.tab,
  )
}
