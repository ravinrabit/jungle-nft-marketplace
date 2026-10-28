import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@/shared/api/contracts/account'
import { hasErrorCode } from '@/shared/api/api-error'
import { authKeys, endSession, isSessionActive, startSession } from '../session-lifecycle'
import { sessionToken } from '../session-token'
import { fetchSession, login, logout, register } from './auth-api'

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: authKeys.session,
    queryFn: async ({ signal }): Promise<Session | null> => {
      if (!sessionToken.read()) {
        return null
      }
      try {
        return await fetchSession(signal)
      } catch (error) {
        if (hasErrorCode(error, 'SESSION_EXPIRED', 'UNAUTHENTICATED')) {
          sessionToken.clear()
          return null
        }
        throw error
      }
    },
    staleTime: Infinity,
    retry: false,
  })
}

export function useSession() {
  const query = useQuery(sessionQueryOptions())
  const session = isSessionActive(query.data) ? query.data : null
  return { session, user: session?.user ?? null, isResolving: query.isPending }
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (response) => startSession(queryClient, response),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (response) => startSession(queryClient, response),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      endSession(queryClient, 'signed-out')
    },
  })
}
