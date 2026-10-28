import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { sessionQueryOptions } from '../api/auth-queries'
import { expireSession } from '../session-expiration'

export function SessionWatcher() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: session } = useQuery(sessionQueryOptions())
  const expiresAt = session?.expiresAt

  useEffect(() => {
    if (!expiresAt) {
      return
    }

    const remaining = Math.max(0, Date.parse(expiresAt) - Date.now())
    const timeout = window.setTimeout(() => {
      expireSession(queryClient, router)
    }, remaining)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [expiresAt, queryClient, router])

  return null
}
