import type { Query, QueryClient, QueryFilters } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  FeaturedNftsResponse,
  NftDetail,
  NftListResponse,
  NftSummary,
  RelatedNftsResponse,
} from '@/shared/api/contracts/catalog'
import type { Cart, CartItem } from '@/shared/api/contracts/commerce'
import type { NftUpdatedEvent } from '@/shared/api/contracts/events'
import { compareEth, formatEth } from '@/shared/lib/eth'
import { catalogKeys } from '@/features/catalog/api/catalog-queries'

function isNewer(current: { version: number }, event: NftUpdatedEvent) {
  return current.version < event.version
}

function patchSummary<TNft extends NftSummary>(nft: TNft, event: NftUpdatedEvent): TNft {
  if (nft.id !== event.resource.id || !isNewer(nft, event)) {
    return nft
  }
  return {
    ...nft,
    price: event.data.price,
    compareAtPrice: event.data.compareAtPrice,
    isAvailable: event.data.isAvailable,
    version: event.version,
  }
}

function patchDetail(detail: NftDetail, event: NftUpdatedEvent): NftDetail {
  if (!isNewer(detail, event)) {
    return detail
  }
  return {
    ...patchSummary(detail, event),
    updatedAt: event.occurredAt,
    editions: detail.editions.map((edition) => {
      const next = event.data.editions.find((candidate) => candidate.kind === edition.kind)
      return next ? { ...edition, available: next.available, price: next.price } : edition
    }),
  }
}

export async function refetchDiscardingInFlight(queryClient: QueryClient, filters: QueryFilters) {
  await queryClient.cancelQueries(filters)
  await queryClient.invalidateQueries(filters)
}

function isRelatedQuery(query: Query) {
  return query.queryKey.at(-1) === 'related'
}

export function isCartQuery(query: Query) {
  return query.queryKey.at(-1) === 'cart'
}

export function isQuoteQuery(query: Query) {
  return query.queryKey.includes('quote')
}

function patchCatalog(queryClient: QueryClient, event: NftUpdatedEvent) {
  const detailKey = catalogKeys.detail(event.resource.id)
  if (queryClient.getQueryData(detailKey)) {
    queryClient.setQueryData<NftDetail>(detailKey, (detail) =>
      detail ? patchDetail(detail, event) : detail,
    )
  } else {
    void refetchDiscardingInFlight(queryClient, { queryKey: detailKey, exact: true })
  }
  queryClient.setQueriesData<NftListResponse>({ queryKey: catalogKeys.lists() }, (list) =>
    list ? { ...list, items: list.items.map((nft) => patchSummary(nft, event)) } : list,
  )
  queryClient.setQueryData<FeaturedNftsResponse>(catalogKeys.featured(), (featured) =>
    featured
      ? {
          hero: featured.hero.map((nft) => patchSummary(nft, event)),
          spotlight: patchSummary(featured.spotlight, event),
        }
      : featured,
  )
  queryClient.setQueriesData<RelatedNftsResponse>(
    { queryKey: catalogKeys.details(), predicate: isRelatedQuery },
    (related) =>
      related ? { items: related.items.map((nft) => patchSummary(nft, event)) } : related,
  )
  void queryClient.invalidateQueries({ queryKey: catalogKeys.lists(), refetchType: 'none' })
}

function readCartItems(queryClient: QueryClient) {
  return queryClient
    .getQueriesData<Cart>({ predicate: isCartQuery })
    .flatMap(([, cart]) => cart?.items ?? [])
}

function notifyCartChanges(
  previous: readonly CartItem[],
  fresh: readonly CartItem[],
  nftId: string,
) {
  const notified = new Set<string>()
  for (const item of fresh) {
    const before = previous.find((candidate) => candidate.id === item.id)
    if (item.nftId !== nftId || !before || notified.has(item.id)) {
      continue
    }
    notified.add(item.id)
    const limit = Math.min(item.available, item.maxPerOrder)
    if (item.quantity > limit) {
      toast.warning(
        limit === 0
          ? `${item.name} esgotou nesta edição.`
          : `${item.name}: restam apenas ${limit} unidade(s) nesta edição.`,
      )
    } else if (compareEth(before.unitPrice, item.unitPrice) !== 0) {
      toast.info(`O preço de ${item.name} mudou para ${formatEth(item.unitPrice)}.`)
    }
  }
}

async function refreshAffectedCarts(queryClient: QueryClient, event: NftUpdatedEvent) {
  const previous = readCartItems(queryClient)
  if (!previous.some((item) => item.nftId === event.resource.id)) {
    return
  }
  void refetchDiscardingInFlight(queryClient, { predicate: isQuoteQuery })
  await refetchDiscardingInFlight(queryClient, { predicate: isCartQuery })
  notifyCartChanges(previous, readCartItems(queryClient), event.resource.id)
}

export function applyNftUpdate(queryClient: QueryClient, event: NftUpdatedEvent) {
  patchCatalog(queryClient, event)
  void refreshAffectedCarts(queryClient, event)
}
