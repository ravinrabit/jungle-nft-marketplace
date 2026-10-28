import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from './api/auth-queries'
import { isSessionActive } from './session-lifecycle'

interface GuardContext {
  context: { queryClient: QueryClient }
  location: { href: string }
}

export async function requireSession({ context, location }: GuardContext) {
  const session = await context.queryClient.query(sessionQueryOptions())

  if (!isSessionActive(session)) {
    throw redirect({ to: '/', search: { auth: 'entrar', redirect: location.href } })
  }

  return { session }
}
