import { useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useLogout } from './api/auth-queries'

const PRIVATE_PATH_PREFIXES = ['/perfil', '/pagamento', '/pedidos'] as const

function isPrivatePath(pathname: string) {
  return PRIVATE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function useSignOut() {
  const router = useRouter()
  const logout = useLogout()

  const signOut = useCallback(() => {
    logout.mutate(undefined, {
      onSettled: () => {
        toast.success('Você saiu da sua conta.')
        if (isPrivatePath(router.state.location.pathname)) {
          void router.navigate({ to: '/' })
          return
        }
        void router.invalidate()
      },
    })
  }, [logout, router])

  return { signOut, isSigningOut: logout.isPending }
}
