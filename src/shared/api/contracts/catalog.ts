import { z } from 'zod'
import { compareEth } from '@/shared/lib/eth'
import {
  entityIdSchema,
  ethAmountSchema,
  isoDateTimeSchema,
  paginatedSchema,
  versionSchema,
} from './common'

export const CATEGORY_IDS = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
] as const

export const NETWORK_IDS = ['ethereum', 'polygon', 'solana'] as const
export const CATALOG_TABS = ['all', 'new', 'trending'] as const
export const CATALOG_SORTS = ['recent', 'price-asc', 'price-desc', 'name-asc'] as const
export const EDITION_KINDS = ['1-1', '1-10', '1-50', 'open'] as const
export const RARITIES = ['common', 'rare', 'legendary'] as const
export const ARTWORK_SLUGS = ['emerald-ape', 'sage-nomad', 'ivory-baron', 'golden-beat'] as const

export const DEFAULT_PAGE_SIZE = 9
export const MAX_PAGE_SIZE = 48
export const MAX_SEARCH_LENGTH = 80

export const categoryIdSchema = z.enum(CATEGORY_IDS)
export const networkIdSchema = z.enum(NETWORK_IDS)
export const catalogTabSchema = z.enum(CATALOG_TABS)
export const catalogSortSchema = z.enum(CATALOG_SORTS)
export const editionKindSchema = z.enum(EDITION_KINDS)
export const raritySchema = z.enum(RARITIES)
export const artworkSlugSchema = z.enum(ARTWORK_SLUGS)

export const editionSchema = z.object({
  kind: editionKindSchema,
  supply: z.number().int().positive().nullable(),
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
  price: ethAmountSchema,
})

export const nftSummarySchema = z.object({
  id: entityIdSchema,
  tokenId: z.string(),
  name: z.string(),
  artwork: artworkSlugSchema,
  imageAlt: z.string(),
  category: categoryIdSchema,
  network: networkIdSchema,
  rarity: raritySchema,
  price: ethAmountSchema,
  compareAtPrice: ethAmountSchema.nullable(),
  isAvailable: z.boolean(),
  version: versionSchema,
})

export const reviewSchema = z.object({
  id: entityIdSchema,
  authorName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: isoDateTimeSchema,
})

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  story: z.array(z.string()),
  collectionName: z.string(),
  creatorName: z.string(),
  attributes: z.array(z.string()),
  gallery: z.array(artworkSlugSchema).min(1),
  rating: z.object({ average: z.string(), count: z.number().int().nonnegative() }),
  reviews: z.array(reviewSchema),
  royaltyPercent: z.number().nonnegative(),
  contractAddress: z.string(),
  defaultEdition: editionKindSchema,
  editions: z.array(editionSchema).min(1),
  listedAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

const facetCountSchema = z.number().int().nonnegative()

export const catalogFacetsSchema = z.object({
  categories: z.array(z.object({ id: categoryIdSchema, count: facetCountSchema })),
  networks: z.array(z.object({ id: networkIdSchema, count: facetCountSchema })),
  priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }).nullable(),
})

export const nftListResponseSchema = paginatedSchema(nftSummarySchema).extend({
  facets: catalogFacetsSchema,
})

export const featuredNftsResponseSchema = z.object({
  hero: z.array(nftSummarySchema).min(1),
  spotlight: nftSummarySchema,
})

export const relatedNftsResponseSchema = z.object({
  items: z.array(nftSummarySchema),
})

export const nftListQuerySchema = z
  .object({
    q: z.string().trim().max(MAX_SEARCH_LENGTH).optional(),
    categories: z.array(categoryIdSchema).default([]),
    networks: z.array(networkIdSchema).default([]),
    minPrice: ethAmountSchema.optional(),
    maxPrice: ethAmountSchema.optional(),
    tab: catalogTabSchema.default('all'),
    sort: catalogSortSchema.default('recent'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || compareEth(minPrice, maxPrice) <= 0,
    { path: ['maxPrice'], message: 'O preço máximo deve ser maior ou igual ao mínimo' },
  )

export type CategoryId = z.infer<typeof categoryIdSchema>
export type NetworkId = z.infer<typeof networkIdSchema>
export type CatalogTab = z.infer<typeof catalogTabSchema>
export type CatalogSort = z.infer<typeof catalogSortSchema>
export type EditionKind = z.infer<typeof editionKindSchema>
export type Rarity = z.infer<typeof raritySchema>
export type ArtworkSlug = z.infer<typeof artworkSlugSchema>
export type Edition = z.infer<typeof editionSchema>
export type NftSummary = z.infer<typeof nftSummarySchema>
export type NftDetail = z.infer<typeof nftDetailSchema>
export type CatalogFacets = z.infer<typeof catalogFacetsSchema>
export type NftListResponse = z.infer<typeof nftListResponseSchema>
export type Review = z.infer<typeof reviewSchema>
export type FeaturedNftsResponse = z.infer<typeof featuredNftsResponseSchema>
export type RelatedNftsResponse = z.infer<typeof relatedNftsResponseSchema>
export type NftListParams = z.input<typeof nftListQuerySchema>
export type NftListQuery = z.output<typeof nftListQuerySchema>
