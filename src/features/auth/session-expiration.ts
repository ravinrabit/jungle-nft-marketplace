import type { QueryClient } from '@tanstack/react-query'
import type { AnyRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Session } from '@/shared/api/contracts/account'
import { authKeys, endSession } from './session-lifecycle'
import { sessionToken } from './session-token'

const EXPIRED_TOAST_ID = 'session-expired'

export function expireSession(queryClient: QueryClient, router: AnyRouter) {
  const hadSession =
    sessionToken.read() !== null ||
    Boolean(queryClient.getQueryData<Session | null>(authKeys.session))

  if (!hadSession) {
    return
  }

  endSession(queryClient)
  toast.warning('Sua sessão expirou. Entre novamente para continuar de onde parou.', {
    id: EXPIRED_TOAST_ID,
  })
  void router.invalidate()
}
