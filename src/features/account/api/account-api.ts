import {
  userSchema,
  walletListResponseSchema,
  walletSchema,
  type PasswordChangeRequest,
  type ProfileUpdateRequest,
  type WalletSlot,
  type WalletUpsertRequest,
} from '@/shared/api/contracts/account'
import { requestData, requestWithoutContent } from '@/shared/api/http-client'

export function fetchProfile(signal: AbortSignal) {
  return requestData(userSchema, { method: 'GET', url: '/me', signal })
}

export function updateProfile(payload: ProfileUpdateRequest) {
  return requestData(userSchema, { method: 'PUT', url: '/me', data: payload })
}

export function updateAvatar(dataUrl: string) {
  return requestData(userSchema, { method: 'PUT', url: '/me/avatar', data: { dataUrl } })
}

export function removeAvatar() {
  return requestData(userSchema, { method: 'DELETE', url: '/me/avatar' })
}

export function changePassword(payload: PasswordChangeRequest) {
  return requestWithoutContent({ method: 'PUT', url: '/me/password', data: payload })
}

export function fetchWallets(signal: AbortSignal) {
  return requestData(walletListResponseSchema, { method: 'GET', url: '/me/wallets', signal })
}

export function saveWallet(slot: WalletSlot, payload: WalletUpsertRequest) {
  return requestData(walletSchema, { method: 'PUT', url: `/me/wallets/${slot}`, data: payload })
}
