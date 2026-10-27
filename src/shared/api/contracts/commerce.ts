import { z } from 'zod'
import { walletProviderSchema } from './account'
import { artworkSlugSchema, editionKindSchema, networkIdSchema } from './catalog'
import { entityIdSchema, ethAmountSchema, isoDateTimeSchema, versionSchema } from './common'

export const ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const
export const QUOTE_ISSUE_TYPES = ['PRICE_CHANGED', 'AVAILABILITY_REDUCED', 'UNAVAILABLE'] as const

export const orderStatusSchema = z.enum(ORDER_STATUSES)
export const quoteIssueTypeSchema = z.enum(QUOTE_ISSUE_TYPES)

const quantitySchema = z.number().int().positive()

export const favoritesSchema = z.object({
  nftIds: z.array(entityIdSchema),
})

export const cartItemSchema = z.object({
  id: entityIdSchema,
  nftId: entityIdSchema,
  editionKind: editionKindSchema,
  quantity: quantitySchema,
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
  name: z.string(),
  tokenId: z.string(),
  artwork: artworkSlugSchema,
  imageAlt: z.string(),
  available: z.number().int().nonnegative(),
  maxPerOrder: quantitySchema,
  nftVersion: versionSchema,
})

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  version: versionSchema,
  updatedAt: isoDateTimeSchema,
})

export const addCartItemRequestSchema = z.object({
  nftId: entityIdSchema,
  editionKind: editionKindSchema,
  quantity: quantitySchema,
})

export const updateCartItemRequestSchema = z.object({
  quantity: quantitySchema,
})

export const mergeCartRequestSchema = z.object({
  items: z.array(addCartItemRequestSchema),
})

export const quoteRequestSchema = z.object({
  couponCode: z.string().trim().toUpperCase().max(32).nullable(),
  network: networkIdSchema.nullable(),
})

export const quoteLineSchema = z.object({
  cartItemId: entityIdSchema,
  nftId: entityIdSchema,
  editionKind: editionKindSchema,
  quantity: quantitySchema,
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
  name: z.string(),
  tokenId: z.string(),
  artwork: artworkSlugSchema,
  imageAlt: z.string(),
})

export const quoteIssueSchema = z.object({
  type: quoteIssueTypeSchema,
  cartItemId: entityIdSchema,
  nftId: entityIdSchema,
  editionKind: editionKindSchema,
  previousUnitPrice: ethAmountSchema.nullable(),
  currentUnitPrice: ethAmountSchema.nullable(),
  requestedQuantity: quantitySchema,
  availableQuantity: z.number().int().nonnegative(),
})

export const couponSchema = z.object({
  code: z.string(),
  description: z.string(),
})

export const quoteSchema = z.object({
  id: entityIdSchema,
  lines: z.array(quoteLineSchema),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  coupon: couponSchema.nullable(),
  network: networkIdSchema,
  issues: z.array(quoteIssueSchema),
  cartVersion: versionSchema,
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
})

export const collectorDetailsSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe pelo menos 2 caracteres').max(40),
  username: z.string().trim().min(3, 'Informe pelo menos 3 caracteres').max(20),
  profileName: z.string().trim().min(2, 'Informe pelo menos 2 caracteres').max(40),
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{4,12}$/, 'Use de 4 a 12 letras maiúsculas ou números'),
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  ensName: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,32}$/, 'Use de 3 a 32 letras minúsculas, números ou hífen'),
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres').nullable(),
})

export const createOrderRequestSchema = z.object({
  quoteId: entityIdSchema,
  walletId: entityIdSchema,
  provider: walletProviderSchema,
  network: networkIdSchema,
  collector: collectorDetailsSchema,
})

export const orderWalletSchema = z.object({
  id: entityIdSchema,
  label: z.string(),
  provider: walletProviderSchema,
  address: z.string(),
  network: networkIdSchema,
})

export const orderSchema = z.object({
  id: entityIdSchema,
  status: orderStatusSchema,
  quoteId: entityIdSchema,
  lines: z.array(quoteLineSchema),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  coupon: couponSchema.nullable(),
  wallet: orderWalletSchema,
  transactionHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  declineReason: z.string().nullable(),
  version: versionSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key'

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type QuoteIssueType = z.infer<typeof quoteIssueTypeSchema>
export type Favorites = z.infer<typeof favoritesSchema>
export type CartItem = z.infer<typeof cartItemSchema>
export type Cart = z.infer<typeof cartSchema>
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>
export type MergeCartRequest = z.infer<typeof mergeCartRequestSchema>
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
export type QuoteLine = z.infer<typeof quoteLineSchema>
export type QuoteIssue = z.infer<typeof quoteIssueSchema>
export type Coupon = z.infer<typeof couponSchema>
export type Quote = z.infer<typeof quoteSchema>
export type CollectorDetails = z.infer<typeof collectorDetailsSchema>
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>
export type OrderWallet = z.infer<typeof orderWalletSchema>
export type Order = z.infer<typeof orderSchema>
