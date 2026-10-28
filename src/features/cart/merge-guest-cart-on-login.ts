import { toast } from 'sonner'
import { getErrorMessage } from '@/shared/api/api-error'
import { onSessionStarted, privateQueryKey } from '@/features/auth/session-lifecycle'
import { mergeGuestCart } from './api/cart-api'
import { cartKeys, GUEST_CART_ROOT } from './api/cart-queries'
import { guestCartId } from './guest-cart-id'

export function registerGuestCartMerge() {
  return onSessionStarted(async (queryClient, session) => {
    const guestId = guestCartId.read()
    if (!guestId) {
      return
    }

    try {
      const cart = await mergeGuestCart(guestId)
      guestCartId.clear()
      queryClient.setQueryData(cartKeys.cart(privateQueryKey(session.user.id)), cart)
      queryClient.removeQueries({ queryKey: [GUEST_CART_ROOT] })

      for (const adjustment of cart.adjustments) {
        toast.info(
          `${adjustment.name}: a quantidade foi ajustada para ${adjustment.appliedQuantity} pela disponibilidade.`,
        )
      }
    } catch (error) {
      toast.error(
        `Não foi possível trazer os itens do carrinho de visitante. ${getErrorMessage(error)}`,
      )
    }
  })
}
