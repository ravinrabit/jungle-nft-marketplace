import { useMutation } from '@tanstack/react-query'
import {
  newsletterSubscriptionResponseSchema,
  type NewsletterSubscriptionRequest,
} from '@/shared/api/contracts/newsletter'
import { requestData } from '@/shared/api/http-client'

function subscribeToNewsletter(payload: NewsletterSubscriptionRequest) {
  return requestData(newsletterSubscriptionResponseSchema, {
    method: 'POST',
    url: '/newsletter/subscriptions',
    data: payload,
  })
}

export function useNewsletterSubscription() {
  return useMutation({ mutationFn: subscribeToNewsletter })
}
