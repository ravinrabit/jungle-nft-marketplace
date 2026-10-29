import { z } from 'zod'

export const NEWSLETTER_STATUSES = ['subscribed', 'already-subscribed'] as const

export const newsletterSubscriptionRequestSchema = z.object({
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
})

export const newsletterSubscriptionResponseSchema = z.object({
  status: z.enum(NEWSLETTER_STATUSES),
})

export type NewsletterSubscriptionRequest = z.infer<typeof newsletterSubscriptionRequestSchema>
export type NewsletterSubscriptionResponse = z.infer<typeof newsletterSubscriptionResponseSchema>
