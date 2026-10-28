import { useCallback } from 'react'
import { toast } from 'sonner'
import type { EditionKind } from '@/shared/api/contracts/catalog'
import { getErrorMessage } from '@/shared/api/api-error'
import { useAuthNavigation } from '@/features/auth/use-auth-navigation'
import { useAddToCart, useFavorites, useToggleFavorite } from './api/cart-queries'

interface AddToCartInput {
  nftId: string
  name: string
  editionKind: EditionKind
  quantity: number
}

export function useAddToCartAction() {
  const addToCart = useAddToCart()

  const add = useCallback(
    (input: AddToCartInput, onAdded?: () => void) => {
      addToCart.mutate(
        { nftId: input.nftId, editionKind: input.editionKind, quantity: input.quantity },
        {
          onSuccess: () => {
            toast.success(`${input.name} foi adicionado ao carrinho.`)
            onAdded?.()
          },
          onError: (error) => {
            toast.error(getErrorMessage(error))
          },
        },
      )
    },
    [addToCart],
  )

  return { add, isAdding: addToCart.isPending }
}

export function useFavoriteAction() {
  const { user, isFavorite } = useFavorites()
  const { openAuth } = useAuthNavigation()
  const toggleFavorite = useToggleFavorite((message) => {
    toast.error(`Não foi possível atualizar seus favoritos. ${message}`)
  })

  const toggle = useCallback(
    (nftId: string, name: string) => {
      if (!user) {
        toast.info('Entre na sua conta para salvar favoritos.')
        openAuth('entrar')
        return
      }
      const nextIsFavorite = !isFavorite(nftId)
      toggleFavorite.mutate(
        { nftId, isFavorite: nextIsFavorite },
        {
          onSuccess: () => {
            toast.success(
              nextIsFavorite
                ? `${name} foi adicionado aos favoritos.`
                : `${name} foi removido dos favoritos.`,
            )
          },
        },
      )
    },
    [isFavorite, openAuth, toggleFavorite, user],
  )

  return { isFavorite, toggle }
}
