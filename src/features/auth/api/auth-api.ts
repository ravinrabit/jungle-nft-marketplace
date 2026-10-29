import {
  authResponseSchema,
  sessionSchema,
  type LoginRequest,
  type PasswordResetRequest,
  type RegisterRequest,
} from '@/shared/api/contracts/account'
import { requestData, requestWithoutContent } from '@/shared/api/http-client'

export function login(payload: LoginRequest) {
  return requestData(authResponseSchema, { method: 'POST', url: '/auth/login', data: payload })
}

export function register(payload: RegisterRequest) {
  return requestData(authResponseSchema, { method: 'POST', url: '/auth/register', data: payload })
}

export function requestPasswordReset(payload: PasswordResetRequest) {
  return requestWithoutContent({ method: 'POST', url: '/auth/password-reset', data: payload })
}

export function fetchSession(signal: AbortSignal) {
  return requestData(sessionSchema, { method: 'GET', url: '/auth/session', signal })
}

export function logout() {
  return requestWithoutContent({ method: 'POST', url: '/auth/logout' })
}
