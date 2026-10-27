import { env } from '@/shared/config/env'

export async function bootstrapMocks() {
  if (!env.isMockingEnabled) {
    return
  }

  const { worker } = await import('@/mocks/browser')

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
}
