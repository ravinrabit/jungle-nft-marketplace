import { z } from 'zod'
import { WALLET_PROVIDERS, type User, type Wallet } from '@/shared/api/contracts/account'
import { NETWORK_IDS } from '@/shared/api/contracts/catalog'
import { collectorDetailsSchema, type CollectorDetails } from '@/shared/api/contracts/commerce'

export const checkoutFormSchema = collectorDetailsSchema.extend({
  walletId: z.string().min(1, 'Selecione uma carteira'),
  provider: z.string().pipe(z.enum(WALLET_PROVIDERS, { error: 'Selecione uma carteira' })),
  network: z.string().pipe(z.enum(NETWORK_IDS, { error: 'Selecione uma rede' })),
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres'),
})

export type CheckoutFormValues = z.input<typeof checkoutFormSchema>
export type CheckoutSubmission = z.output<typeof checkoutFormSchema>

export const CHECKOUT_FIELDS = [
  'walletId',
  'provider',
  'network',
  'displayName',
  'username',
  'profileName',
  'referralCode',
  'email',
  'ensName',
  'note',
] as const satisfies readonly (keyof CheckoutFormValues)[]

export function walletDefaults(wallet: Wallet) {
  return {
    walletId: wallet.id,
    provider: wallet.provider,
    network: wallet.network,
    profileName: wallet.profileName,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensName: wallet.ensName,
  } satisfies Partial<CheckoutFormValues>
}

export function createCheckoutDefaults(user: User, wallet: Wallet | undefined): CheckoutFormValues {
  const base: CheckoutFormValues = {
    walletId: '',
    provider: '',
    network: '',
    displayName: user.displayName,
    username: user.username,
    profileName: '',
    referralCode: '',
    email: user.email,
    ensName: user.ensName ?? '',
    note: '',
  }
  return wallet ? { ...base, ...walletDefaults(wallet) } : base
}

export function toCollectorDetails(values: CheckoutSubmission): CollectorDetails {
  return {
    displayName: values.displayName,
    username: values.username,
    profileName: values.profileName,
    referralCode: values.referralCode,
    email: values.email,
    ensName: values.ensName,
    note: values.note || null,
  }
}
