import { z } from 'zod'

export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'AVAILABILITY_CONFLICT',
  'PRICE_CHANGED',
  'QUOTE_EXPIRED',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'IDEMPOTENCY_CONFLICT',
  'PAYMENT_DECLINED',
  'TRANSIENT_FAILURE',
  'INTERNAL_ERROR',
] as const

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES)

export const fieldErrorsSchema = z.record(z.string(), z.array(z.string()))

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fieldErrors: fieldErrorsSchema.optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  requestId: z.string(),
})

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>
export type FieldErrors = z.infer<typeof fieldErrorsSchema>
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
