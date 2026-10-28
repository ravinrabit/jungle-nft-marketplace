import type { QueryClient } from '@tanstack/react-query'
import type { AuthResponse, Session } from '@/shared/api/contracts/account'
import { sessionToken } from './session-token'

export const PRIVATE_QUERY_ROOT = 'private'

export const authKeys = {
  session: ['session'] as const,
}

export function privateQueryKey(userId: string) {
  return [PRIVATE_QUERY_ROOT, userId] as const
}

function discardPrivateData(queryClient: QueryClient) {
  void queryClient.cancelQueries({ queryKey: [PRIVATE_QUERY_ROOT] })
  queryClient.removeQueries({ queryKey: [PRIVATE_QUERY_ROOT] })
}

type SessionStartListener = (queryClient: QueryClient, session: Session) => Promise<void>

const sessionStartListeners = new Set<SessionStartListener>()

export function onSessionStarted(listener: SessionStartListener) {
  sessionStartListeners.add(listener)
  return () => {
    sessionStartListeners.delete(listener)
  }
}

export async function startSession(queryClient: QueryClient, response: AuthResponse) {
  discardPrivateData(queryClient)
  sessionToken.write(response.token)
  queryClient.setQueryData<Session | null>(authKeys.session, response.session)
  await Promise.all(
    [...sessionStartListeners].map((listener) => listener(queryClient, response.session)),
  )
}

export function endSession(queryClient: QueryClient) {
  sessionToken.clear()
  discardPrivateData(queryClient)
  queryClient.setQueryData<Session | null>(authKeys.session, null)
}

export function isSessionActive(session: Session | null | undefined): session is Session {
  return Boolean(session && Date.parse(session.expiresAt) > Date.now())
}
