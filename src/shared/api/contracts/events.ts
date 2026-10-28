import { z } from 'zod'
import { editionKindSchema } from './catalog'
import { entityIdSchema, ethAmountSchema, isoDateTimeSchema, versionSchema } from './common'
import { orderStatusSchema } from './commerce'

export const SOCKET_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const

export const SOCKET_CLIENT_EVENTS = {
  identify: 'session.identify',
} as const

const eventEnvelope = {
  eventId: entityIdSchema,
  version: versionSchema,
  occurredAt: isoDateTimeSchema,
}

export const nftUpdatedEventSchema = z.object({
  ...eventEnvelope,
  type: z.literal(SOCKET_EVENTS.nftUpdated),
  resource: z.object({ type: z.literal('nft'), id: entityIdSchema }),
  data: z.object({
    price: ethAmountSchema,
    compareAtPrice: ethAmountSchema.nullable(),
    isAvailable: z.boolean(),
    editions: z.array(
      z.object({
        kind: editionKindSchema,
        available: z.number().int().nonnegative(),
        price: ethAmountSchema,
      }),
    ),
  }),
})

export const orderUpdatedEventSchema = z.object({
  ...eventEnvelope,
  type: z.literal(SOCKET_EVENTS.orderUpdated),
  resource: z.object({ type: z.literal('order'), id: entityIdSchema }),
  data: z.object({
    status: orderStatusSchema,
    transactionHash: z.string().nullable(),
    explorerUrl: z.url({ protocol: /^https$/ }).nullable(),
    declineReason: z.string().nullable(),
  }),
})

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>
