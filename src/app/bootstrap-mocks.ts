import { env } from '@/shared/config/env'

export async function bootstrapMocks() {
  if (!env.isMockingEnabled) {
    return
  }

  const { startMockEnvironment } = await import('@/mocks/browser')
  await startMockEnvironment()
}
