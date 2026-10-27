import { QueryClient } from '@tanstack/react-query'

const ONE_MINUTE = 60_000

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ONE_MINUTE,
        gcTime: 5 * ONE_MINUTE,
        refetchOnWindowFocus: false,
        retry: 2,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
