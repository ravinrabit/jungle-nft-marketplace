import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/api/api-error'

const ONE_MINUTE = 60_000
const MAX_QUERY_RETRIES = 2

export function shouldRetryQuery(failureCount: number, error: unknown) {
  return isApiError(error) && error.isRetryable && failureCount < MAX_QUERY_RETRIES
}

export function retryDelay(attempt: number) {
  return Math.min(1_000 * 2 ** attempt, 8_000)
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ONE_MINUTE,
        gcTime: 5 * ONE_MINUTE,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        retryDelay,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
