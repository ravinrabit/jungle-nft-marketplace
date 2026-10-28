import { authHandlers } from './http/auth-handlers'
import { catalogHandlers } from './http/catalog-handlers'

export const handlers = [...authHandlers, ...catalogHandlers]
