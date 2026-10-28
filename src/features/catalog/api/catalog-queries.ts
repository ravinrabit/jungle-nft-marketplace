import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListParams } from '@/shared/api/contracts/catalog'
import { fetchFeaturedNfts, fetchNftDetail, fetchNftList, fetchRelatedNfts } from './catalog-api'

const FIVE_MINUTES = 5 * 60_000

export const catalogKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (params: NftListParams) => [...catalogKeys.lists(), params] as const,
  featured: () => [...catalogKeys.all, 'featured'] as const,
  details: () => [...catalogKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...catalogKeys.details(), nftId] as const,
  related: (nftId: string) => [...catalogKeys.detail(nftId), 'related'] as const,
}

export function nftListQueryOptions(params: NftListParams) {
  return queryOptions({
    queryKey: catalogKeys.list(params),
    queryFn: ({ signal }) => fetchNftList(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function featuredNftsQueryOptions() {
  return queryOptions({
    queryKey: catalogKeys.featured(),
    queryFn: ({ signal }) => fetchFeaturedNfts(signal),
    staleTime: FIVE_MINUTES,
  })
}

export function nftDetailQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: catalogKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNftDetail(nftId, signal),
  })
}

export function relatedNftsQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: catalogKeys.related(nftId),
    queryFn: ({ signal }) => fetchRelatedNfts(nftId, signal),
    staleTime: FIVE_MINUTES,
  })
}
