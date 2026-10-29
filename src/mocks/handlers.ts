import { authHandlers } from './http/auth-handlers'
import { cartHandlers } from './http/cart-handlers'
import { catalogHandlers } from './http/catalog-handlers'
import { checkoutHandlers } from './http/checkout-handlers'
import { favoritesHandlers } from './http/favorites-handlers'
import { meHandlers } from './http/me-handlers'
import { newsletterHandlers } from './http/newsletter-handlers'
import { realtimeHandlers } from './realtime/socket-handlers'

export const handlers = [
  ...authHandlers,
  ...meHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...newsletterHandlers,
  ...catalogHandlers,
  ...realtimeHandlers,
]
