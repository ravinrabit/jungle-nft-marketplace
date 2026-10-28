import { useNavigate, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { AuthMode } from './auth-search'

let focusReturnTarget: HTMLElement | null = null

function rememberOpener() {
  const active = document.activeElement
  if (active instanceof HTMLElement && !active.closest('[role="dialog"]')) {
    focusReturnTarget = active
  }
}

function restoreOpenerFocus() {
  const target = focusReturnTarget
  focusReturnTarget = null
  requestAnimationFrame(() => {
    if (target?.isConnected) {
      target.focus()
    }
  })
}

export function useAuthNavigation() {
  const navigate = useNavigate()
  const router = useRouter()

  const openAuth = useCallback(
    (mode: AuthMode, redirect?: string) => {
      rememberOpener()
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
    }).then(restoreOpenerFocus)
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
