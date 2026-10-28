import type { Wallet, WalletFormValues, WalletProvider } from '@/shared/api/contracts/account'

export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export const EMPTY_WALLET_VALUES: WalletFormValues = {
  label: '',
  nickname: '',
  network: '',
  profileName: '',
  address: '',
  alternateAddress: '',
  provider: '',
  referralCode: '',
  email: '',
  ensName: '',
}

export function toWalletFormValues(wallet: Wallet): WalletFormValues {
  return {
    label: wallet.label,
    nickname: wallet.nickname,
    network: wallet.network,
    profileName: wallet.profileName,
    address: wallet.address,
    alternateAddress: wallet.alternateAddress ?? '',
    provider: wallet.provider,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensName: wallet.ensName,
  }
}
