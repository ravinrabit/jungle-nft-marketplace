import { HttpResponse } from 'msw'
import { newsletterSubscriptionRequestSchema } from '@/shared/api/contracts/newsletter'
import { database } from '@/mocks/db/database'
import { mockApi, readJson } from './mock-api'
import { validationError } from './responses'

export const newsletterHandlers = [
  mockApi.post('/newsletter/subscriptions', async ({ request }) => {
    const body = newsletterSubscriptionRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Informe um e-mail válido.')
    }

    const isNew = database.write((state) => {
      if (state.newsletterSubscriptions.some(({ email }) => email === body.data.email)) {
        return false
      }
      state.newsletterSubscriptions.push({
        email: body.data.email,
        subscribedAt: new Date().toISOString(),
      })
      return true
    })

    return isNew
      ? HttpResponse.json({ status: 'subscribed' }, { status: 201 })
      : HttpResponse.json({ status: 'already-subscribed' })
  }),
]
