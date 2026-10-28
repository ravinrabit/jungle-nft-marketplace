import { useNavigate, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { AuthMode } from './auth-search'

export function useAuthNavigation() {
  const navigate = useNavigate()
  const router = useRouter()

  const openAuth = useCallback(
    (mode: AuthMode, redirect?: string) => {
      void navigate({
        to: '.',
        search: (previous) => ({
          ...previous,
          auth: mode,
          redirect: redirect ?? previous.redirect,
        }),
        resetScroll: false,
      })
    },
    [navigate],
  )

  const closeAuth = useCallback(() => {
    void navigate({
      to: '.',
      search: (previous) => ({ ...previous, auth: undefined, redirect: undefined }),
      replace: true,
      resetScroll: false,
    })
  }, [navigate])

  const completeAuth = useCallback(
    (redirect: string | undefined) => {
      if (redirect) {
        router.history.replace(redirect)
        return
      }
      closeAuth()
    },
    [closeAuth, router],
  )

  return { openAuth, closeAuth, completeAuth }
}
