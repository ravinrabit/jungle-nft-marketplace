import {
  featuredNftsResponseSchema,
  nftDetailSchema,
  nftListResponseSchema,
  relatedNftsResponseSchema,
  type NftListParams,
} from '@/shared/api/contracts/catalog'
import { requestData } from '@/shared/api/http-client'

function nftPath(nftId: string) {
  return `/nfts/${encodeURIComponent(nftId)}`
}

export function fetchNftList(params: NftListParams, signal: AbortSignal) {
  return requestData(nftListResponseSchema, { method: 'GET', url: '/nfts', params, signal })
}

export function fetchFeaturedNfts(signal: AbortSignal) {
  return requestData(featuredNftsResponseSchema, { method: 'GET', url: '/nfts/featured', signal })
}

export function fetchNftDetail(nftId: string, signal: AbortSignal) {
  return requestData(nftDetailSchema, { method: 'GET', url: nftPath(nftId), signal })
}

export function fetchRelatedNfts(nftId: string, signal: AbortSignal) {
  return requestData(relatedNftsResponseSchema, {
    method: 'GET',
    url: `${nftPath(nftId)}/related`,
    signal,
  })
}
