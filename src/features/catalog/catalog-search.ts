import { z } from 'zod'
import {
  catalogSortSchema,
  catalogTabSchema,
  categoryIdSchema,
  MAX_SEARCH_LENGTH,
  networkIdSchema,
  type NftListParams,
} from '@/shared/api/contracts/catalog'
import { ethAmountSchema } from '@/shared/api/contracts/common'
import { compareEth } from '@/shared/lib/eth'

function commaSeparatedList<TItem extends z.ZodType<string>>(item: TItem) {
  return z.preprocess(
    (value) => (typeof value === 'string' ? value.split(',') : value),
    z
      .array(z.string())
      .transform((values) => [...new Set(values.filter((value) => item.safeParse(value).success))])
      .transform((values) => values.sort() as z.output<TItem>[])
      .transform((values) => (values.length > 0 ? values : undefined)),
  )
}

export const catalogSearchSchema = z
  .object({
    q: z.string().trim().min(1).max(MAX_SEARCH_LENGTH).optional().catch(undefined),
    categories: commaSeparatedList(categoryIdSchema).optional().catch(undefined),
    networks: commaSeparatedList(networkIdSchema).optional().catch(undefined),
    minPrice: ethAmountSchema.optional().catch(undefined),
    maxPrice: ethAmountSchema.optional().catch(undefined),
    tab: catalogTabSchema.exclude(['all']).optional().catch(undefined),
    sort: catalogSortSchema.exclude(['recent']).optional().catch(undefined),
    page: z.coerce.number().int().min(2).optional().catch(undefined),
  })
  .transform((search) =>
    search.minPrice && search.maxPrice && compareEth(search.minPrice, search.maxPrice) > 0
      ? { ...search, minPrice: search.maxPrice, maxPrice: search.minPrice }
      : search,
  )

export type CatalogSearch = z.output<typeof catalogSearchSchema>

export function toNftListParams(search: CatalogSearch): NftListParams {
  return {
    q: search.q,
    categories: search.categories ?? [],
    networks: search.networks ?? [],
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    tab: search.tab ?? 'all',
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
  }
}

export function withFilterChange(
  search: CatalogSearch,
  change: Partial<Omit<CatalogSearch, 'page'>>,
): CatalogSearch {
  return { ...search, ...change, page: undefined }
}
