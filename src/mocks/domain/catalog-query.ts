import {
  CATEGORY_IDS,
  NETWORK_IDS,
  type CatalogFacets,
  type CatalogSort,
  type CatalogTab,
  type FeaturedNftsResponse,
  type NftDetail,
  type NftListQuery,
  type NftListResponse,
  type NftSummary,
} from '@/shared/api/contracts/catalog'
import { compareEth } from '@/shared/lib/eth'
import {
  CATALOG_REFERENCE_DATE,
  FEATURED_HERO_IDS,
  FEATURED_SPOTLIGHT_ID,
  NEW_RELEASE_WINDOW_DAYS,
  RELATED_NFTS_LIMIT,
  TRENDING_SCORE_THRESHOLD,
} from '@/mocks/db/fixtures/catalog-fixtures'
import type { NftRecord } from '@/mocks/db/records'
import { normalizeForSearch } from '@/mocks/lib/text'

const DAY_IN_MS = 86_400_000
const NEW_RELEASE_CUTOFF = CATALOG_REFERENCE_DATE.getTime() - NEW_RELEASE_WINDOW_DAYS * DAY_IN_MS

export function toNftSummary(record: NftRecord): NftSummary {
  return {
    id: record.id,
    tokenId: record.tokenId,
    name: record.name,
    artwork: record.artwork,
    imageAlt: record.imageAlt,
    category: record.category,
    network: record.network,
    rarity: record.rarity,
    price: record.price,
    compareAtPrice: record.compareAtPrice,
    isAvailable: record.isAvailable,
    defaultEdition: record.defaultEdition,
    version: record.version,
  }
}

export function toNftDetail(record: NftRecord): NftDetail {
  const { trendingScore, ...detail } = record
  return detail
}

function matchesSearch(record: NftRecord, search: string | undefined) {
  if (!search) {
    return true
  }
  const needle = normalizeForSearch(search)
  return [record.name, record.tokenId, record.collectionName, record.creatorName].some((field) =>
    normalizeForSearch(field).includes(needle),
  )
}

function matchesTab(record: NftRecord, tab: CatalogTab) {
  switch (tab) {
    case 'all':
      return true
    case 'new':
      return new Date(record.listedAt).getTime() >= NEW_RELEASE_CUTOFF
    case 'trending':
      return record.trendingScore >= TRENDING_SCORE_THRESHOLD
  }
}

function matchesPrice(
  record: NftRecord,
  minPrice: string | undefined,
  maxPrice: string | undefined,
) {
  const aboveMin = minPrice === undefined || compareEth(record.price, minPrice) >= 0
  const belowMax = maxPrice === undefined || compareEth(record.price, maxPrice) <= 0
  return aboveMin && belowMax
}

function compareRecords(sort: CatalogSort) {
  return (left: NftRecord, right: NftRecord) => {
    switch (sort) {
      case 'recent':
        return right.listedAt.localeCompare(left.listedAt) || left.id.localeCompare(right.id)
      case 'price-asc':
        return compareEth(left.price, right.price) || left.id.localeCompare(right.id)
      case 'price-desc':
        return compareEth(right.price, left.price) || left.id.localeCompare(right.id)
      case 'name-asc':
        return left.name.localeCompare(right.name, 'pt-BR')
    }
  }
}

function buildFacets(records: readonly NftRecord[]): CatalogFacets {
  const prices = records.map((record) => record.price).sort(compareEth)
  const min = prices[0]
  const max = prices[prices.length - 1]

  return {
    categories: CATEGORY_IDS.map((id) => ({
      id,
      count: records.filter((record) => record.category === id).length,
    })),
    networks: NETWORK_IDS.map((id) => ({
      id,
      count: records.filter((record) => record.network === id).length,
    })),
    priceRange: min !== undefined && max !== undefined ? { min, max } : null,
  }
}

export function selectFeatured(records: readonly NftRecord[]): FeaturedNftsResponse | null {
  const byId = new Map(records.map((record) => [record.id, record]))
  const hero = FEATURED_HERO_IDS.flatMap((id) => {
    const record = byId.get(id)
    return record ? [toNftSummary(record)] : []
  })
  const spotlight = byId.get(FEATURED_SPOTLIGHT_ID)

  if (hero.length === 0 || !spotlight) {
    return null
  }

  return { hero, spotlight: toNftSummary(spotlight) }
}

function byTrending(left: NftRecord, right: NftRecord) {
  return right.trendingScore - left.trendingScore || left.id.localeCompare(right.id)
}

export function selectRelated(records: readonly NftRecord[], source: NftRecord) {
  const others = records.filter((record) => record.id !== source.id)
  const sameCategory = others
    .filter((record) => record.category === source.category)
    .sort(byTrending)
  const remaining = others.filter((record) => record.category !== source.category).sort(byTrending)

  return [...sameCategory, ...remaining].slice(0, RELATED_NFTS_LIMIT).map(toNftSummary)
}

export function queryCatalog(records: readonly NftRecord[], query: NftListQuery): NftListResponse {
  const searchable = records.filter(
    (record) => matchesSearch(record, query.q) && matchesTab(record, query.tab),
  )

  const filtered = searchable
    .filter((record) => query.categories.length === 0 || query.categories.includes(record.category))
    .filter((record) => query.networks.length === 0 || query.networks.includes(record.network))
    .filter((record) => matchesPrice(record, query.minPrice, query.maxPrice))
    .sort(compareRecords(query.sort))

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / query.pageSize)
  const start = (query.page - 1) * query.pageSize

  return {
    items: filtered.slice(start, start + query.pageSize).map(toNftSummary),
    page: query.page,
    pageSize: query.pageSize,
    totalItems,
    totalPages,
    facets: buildFacets(searchable),
  }
}
