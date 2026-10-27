import {
  nftDetailSchema,
  nftListResponseSchema,
  type NftListParams,
} from '@/shared/api/contracts/catalog'
import { requestData } from '@/shared/api/http-client'

export function fetchNftList(params: NftListParams, signal: AbortSignal) {
  return requestData(nftListResponseSchema, {
    method: 'GET',
    url: '/nfts',
    params,
    signal,
  })
}

export function fetchNftDetail(nftId: string, signal: AbortSignal) {
  return requestData(nftDetailSchema, {
    method: 'GET',
    url: `/nfts/${encodeURIComponent(nftId)}`,
    signal,
  })
}
