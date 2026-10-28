import { authHandlers } from './http/auth-handlers'
import { catalogHandlers } from './http/catalog-handlers'
import { meHandlers } from './http/me-handlers'

export const handlers = [...authHandlers, ...meHandlers, ...catalogHandlers]
