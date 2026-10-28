import { useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useLogout } from './api/auth-queries'

export function useSignOut() {
  const router = useRouter()
  const logout = useLogout()

  const signOut = useCallback(() => {
    logout.mutate(undefined, {
      onSettled: () => {
        toast.success('Você saiu da sua conta.')
        void router.invalidate()
      },
    })
  }, [logout, router])

  return { signOut, isSigningOut: logout.isPending }
}
