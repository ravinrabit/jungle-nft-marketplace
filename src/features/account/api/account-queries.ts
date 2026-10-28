import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session, User, WalletSlot, WalletUpsertRequest } from '@/shared/api/contracts/account'
import { authKeys, privateQueryKey } from '@/features/auth/session-lifecycle'
import {
  changePassword,
  fetchProfile,
  fetchWallets,
  removeAvatar,
  saveWallet,
  updateAvatar,
  updateProfile,
} from './account-api'

export const accountKeys = {
  profile: (userId: string) => [...privateQueryKey(userId), 'profile'] as const,
  wallets: (userId: string) => [...privateQueryKey(userId), 'wallets'] as const,
}

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: accountKeys.profile(userId),
    queryFn: ({ signal }) => fetchProfile(signal),
  })
}

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: accountKeys.wallets(userId),
    queryFn: ({ signal }) => fetchWallets(signal),
  })
}

function useApplyUser() {
  const queryClient = useQueryClient()
  return (user: User) => {
    queryClient.setQueryData(accountKeys.profile(user.id), user)
    queryClient.setQueryData<Session | null>(authKeys.session, (session) =>
      session && session.user.id === user.id ? { ...session, user } : session,
    )
  }
}

export function useUpdateProfile() {
  const applyUser = useApplyUser()
  return useMutation({ mutationFn: updateProfile, onSuccess: applyUser })
}

export function useUpdateAvatar() {
  const applyUser = useApplyUser()
  return useMutation({ mutationFn: updateAvatar, onSuccess: applyUser })
}

export function useRemoveAvatar() {
  const applyUser = useApplyUser()
  return useMutation({ mutationFn: removeAvatar, onSuccess: applyUser })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}

export function useSaveWallet(userId: string, slot: WalletSlot) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WalletUpsertRequest) => saveWallet(slot, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.wallets(userId) })
    },
  })
}
