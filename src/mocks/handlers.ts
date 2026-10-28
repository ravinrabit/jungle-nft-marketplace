import { authHandlers } from './http/auth-handlers'
import { cartHandlers } from './http/cart-handlers'
import { catalogHandlers } from './http/catalog-handlers'
import { favoritesHandlers } from './http/favorites-handlers'
import { meHandlers } from './http/me-handlers'

export const handlers = [
  ...authHandlers,
  ...meHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...catalogHandlers,
]
