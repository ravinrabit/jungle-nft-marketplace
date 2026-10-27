import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListParams } from '@/shared/api/contracts/catalog'
import { fetchNftDetail, fetchNftList } from './catalog-api'

export const catalogKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (params: NftListParams) => [...catalogKeys.lists(), params] as const,
  details: () => [...catalogKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...catalogKeys.details(), nftId] as const,
}

export function nftListQueryOptions(params: NftListParams) {
  return queryOptions({
    queryKey: catalogKeys.list(params),
    queryFn: ({ signal }) => fetchNftList(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function nftDetailQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: catalogKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNftDetail(nftId, signal),
  })
}
