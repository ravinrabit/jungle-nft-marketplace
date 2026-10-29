import {
  cartSchema,
  favoriteNftsResponseSchema,
  favoritesSchema,
  GUEST_CART_HEADER,
  quoteSchema,
  type AddCartItemRequest,
  type QuoteRequest,
} from '@/shared/api/contracts/commerce'
import { requestData } from '@/shared/api/http-client'
import { sessionToken } from '@/features/auth/session-token'
import { guestCartId } from '../guest-cart-id'

function cartHeaders(): Record<string, string> {
  return sessionToken.read() ? {} : { [GUEST_CART_HEADER]: guestCartId.ensure() }
}

export function fetchCart(signal: AbortSignal) {
  return requestData(cartSchema, { method: 'GET', url: '/cart', headers: cartHeaders(), signal })
}

export function addCartItem(payload: AddCartItemRequest) {
  return requestData(cartSchema, {
    method: 'POST',
    url: '/cart/items',
    headers: cartHeaders(),
    data: payload,
  })
}

export function updateCartItem(itemId: string, quantity: number) {
  return requestData(cartSchema, {
    method: 'PATCH',
    url: `/cart/items/${encodeURIComponent(itemId)}`,
    headers: cartHeaders(),
    data: { quantity },
  })
}

export function removeCartItem(itemId: string) {
  return requestData(cartSchema, {
    method: 'DELETE',
    url: `/cart/items/${encodeURIComponent(itemId)}`,
    headers: cartHeaders(),
  })
}

export function mergeGuestCart(guestId: string) {
  return requestData(cartSchema, {
    method: 'POST',
    url: '/cart/merge',
    data: { guestCartId: guestId },
  })
}

export function requestQuote(payload: QuoteRequest, signal?: AbortSignal) {
  return requestData(quoteSchema, {
    method: 'POST',
    url: '/cart/quote',
    headers: cartHeaders(),
    data: payload,
    ...(signal ? { signal } : {}),
  })
}

export function fetchFavorites(signal: AbortSignal) {
  return requestData(favoritesSchema, { method: 'GET', url: '/me/favorites', signal })
}

export function fetchFavoriteNfts(signal: AbortSignal) {
  return requestData(favoriteNftsResponseSchema, {
    method: 'GET',
    url: '/me/favorites/items',
    signal,
  })
}

export function setFavorite(nftId: string, isFavorite: boolean) {
  return requestData(favoritesSchema, {
    method: isFavorite ? 'PUT' : 'DELETE',
    url: `/me/favorites/${encodeURIComponent(nftId)}`,
  })
}
