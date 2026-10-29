import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import type { Session } from '@/shared/api/contracts/account'
import type { Cart, Favorites, QuoteRequest } from '@/shared/api/contracts/commerce'
import { getErrorMessage, hasErrorCode } from '@/shared/api/api-error'
import { useSession } from '@/features/auth/api/auth-queries'
import {
  authKeys,
  isSessionActive,
  PRIVATE_QUERY_ROOT,
  privateQueryKey,
} from '@/features/auth/session-lifecycle'
import { sessionToken } from '@/features/auth/session-token'
import { catalogKeys } from '@/features/catalog/api/catalog-queries'
import { guestCartId } from '../guest-cart-id'
import {
  addCartItem,
  fetchCart,
  fetchFavoriteNfts,
  fetchFavorites,
  removeCartItem,
  requestQuote,
  setFavorite,
  updateCartItem,
} from './cart-api'

export const GUEST_CART_ROOT = 'guest-cart'

export type CartOwnerKey = readonly unknown[]

export const cartKeys = {
  cart: (owner: CartOwnerKey) => [...owner, 'cart'] as const,
  quote: (owner: CartOwnerKey, cartVersion: number, request: QuoteRequest) =>
    [...owner, 'quote', cartVersion, request] as const,
  favorites: (userId: string) => [...privateQueryKey(userId), 'favorites'] as const,
  favoriteNfts: (userId: string) => [...privateQueryKey(userId), 'favorite-nfts'] as const,
}

const PENDING_SESSION_OWNER: CartOwnerKey = [PRIVATE_QUERY_ROOT, 'sessao-pendente']

function guestOwner(): CartOwnerKey {
  return [GUEST_CART_ROOT, guestCartId.ensure()]
}

export function useCartOwner(): CartOwnerKey {
  const { user, isResolving } = useSession()
  if (user) {
    return privateQueryKey(user.id)
  }
  return isResolving && sessionToken.read() ? PENDING_SESSION_OWNER : guestOwner()
}

function currentCartOwner(queryClient: QueryClient): CartOwnerKey | null {
  if (!sessionToken.read()) {
    return guestOwner()
  }
  const session = queryClient.getQueryData<Session | null>(authKeys.session)
  return isSessionActive(session) ? privateQueryKey(session.user.id) : null
}

export function cartQueryOptions(owner: CartOwnerKey) {
  return queryOptions({
    queryKey: cartKeys.cart(owner),
    queryFn: ({ signal }) => fetchCart(signal),
    staleTime: 30_000,
  })
}

export function quoteQueryOptions(owner: CartOwnerKey, cartVersion: number, request: QuoteRequest) {
  return queryOptions({
    queryKey: cartKeys.quote(owner, cartVersion, request),
    queryFn: ({ signal }) => requestQuote(request, signal),
    staleTime: 60_000,
    retry: (failureCount, error) =>
      !hasErrorCode(error, 'COUPON_INVALID', 'COUPON_EXPIRED', 'VALIDATION_ERROR') &&
      failureCount < 2,
  })
}

export function useCart() {
  const owner = useCartOwner()
  const query = useQuery({
    ...cartQueryOptions(owner),
    enabled: owner !== PENDING_SESSION_OWNER,
  })
  return { owner, query }
}

function useApplyCart() {
  const queryClient = useQueryClient()
  return (cart: Cart) => {
    const owner = currentCartOwner(queryClient)
    if (owner) {
      queryClient.setQueryData(cartKeys.cart(owner), cart)
    } else {
      void queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.at(-1) === 'cart',
      })
    }
  }
}

function refreshAfterConflict(queryClient: QueryClient, owner: CartOwnerKey, error: unknown) {
  if (hasErrorCode(error, 'AVAILABILITY_CONFLICT')) {
    void queryClient.invalidateQueries({ queryKey: cartKeys.cart(owner) })
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
  }
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const owner = useCartOwner()
  const applyCart = useApplyCart()
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: applyCart,
    onError: (error) => {
      refreshAfterConflict(queryClient, owner, error)
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  const owner = useCartOwner()
  const applyCart = useApplyCart()
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: applyCart,
    onError: (error) => {
      refreshAfterConflict(queryClient, owner, error)
    },
  })
}

export function useRemoveCartItem() {
  const applyCart = useApplyCart()
  return useMutation({ mutationFn: removeCartItem, onSuccess: applyCart })
}

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: cartKeys.favorites(userId),
    queryFn: ({ signal }) => fetchFavorites(signal),
  })
}

export function favoriteNftsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: cartKeys.favoriteNfts(userId),
    queryFn: ({ signal }) => fetchFavoriteNfts(signal),
  })
}

export function useFavorites() {
  const { user } = useSession()
  const query = useQuery({
    ...favoritesQueryOptions(user?.id ?? 'anonimo'),
    enabled: Boolean(user),
  })
  const ids = new Set(query.data?.nftIds ?? [])
  return { user, isFavorite: (nftId: string) => ids.has(nftId) }
}

interface ToggleFavoriteContext {
  previous: Favorites | undefined
  key: ReturnType<typeof cartKeys.favorites>
}

export function useToggleFavorite(onError: (message: string) => void) {
  const queryClient = useQueryClient()
  const { user } = useSession()

  return useMutation<
    Favorites,
    unknown,
    { nftId: string; isFavorite: boolean },
    ToggleFavoriteContext
  >({
    mutationFn: ({ nftId, isFavorite }) => setFavorite(nftId, isFavorite),
    onMutate: async ({ nftId, isFavorite }) => {
      const key = cartKeys.favorites(user?.id ?? 'anonimo')
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Favorites>(key)
      const current = previous?.nftIds ?? []
      queryClient.setQueryData<Favorites>(key, {
        nftIds: isFavorite
          ? [...new Set([...current, nftId])]
          : current.filter((id) => id !== nftId),
      })
      return { previous, key }
    },
    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.key, context.previous)
      }
      onError(getErrorMessage(error))
    },
    onSuccess: (favorites, _variables, context) => {
      queryClient.setQueryData(context.key, favorites)
    },
    onSettled: () => {
      if (user) {
        void queryClient.invalidateQueries({ queryKey: cartKeys.favoriteNfts(user.id) })
      }
    },
  })
}
