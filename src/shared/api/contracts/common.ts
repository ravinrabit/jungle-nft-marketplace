import { z } from 'zod'
import { ETH_DECIMAL_PATTERN } from '@/shared/lib/eth'

export const ethAmountSchema = z
  .string()
  .regex(ETH_DECIMAL_PATTERN, 'Informe um valor em ETH com ponto decimal, por exemplo 1.25')

export const isoDateTimeSchema = z.iso.datetime()

export const entityIdSchema = z.string().min(1)

export const versionSchema = z.number().int().nonnegative()

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export function paginatedSchema<TItem extends z.ZodType>(item: TItem) {
  return paginationMetaSchema.extend({ items: z.array(item) })
}

export type EthAmount = z.infer<typeof ethAmountSchema>
export type PaginationMeta = z.infer<typeof paginationMetaSchema>
