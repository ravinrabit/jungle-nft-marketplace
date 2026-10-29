import { z } from 'zod'
import { NETWORK_IDS, networkIdSchema, type NetworkId } from './catalog'
import { entityIdSchema, isoDateTimeSchema, versionSchema } from './common'

export const WALLET_PROVIDERS = ['metamask', 'walletconnect', 'coinbase'] as const
export const WALLET_SLOTS = ['primary', 'secondary'] as const

export const PASSWORD_MIN_LENGTH = 8
export const MAX_AVATAR_BYTES = 512 * 1024
const MAX_AVATAR_DATA_URL_LENGTH = Math.ceil((MAX_AVATAR_BYTES * 4) / 3) + 64

const emailSchema = z.email('Informe um e-mail válido').trim().toLowerCase()

const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_.]{3,20}$/, 'Use de 3 a 20 letras, números, ponto ou sublinhado')

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .regex(/[A-Za-z]/, 'A senha precisa ter pelo menos uma letra')
  .regex(/\d/, 'A senha precisa ter pelo menos um número')

const ensNameSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{3,32}$/, 'Use de 3 a 32 letras minúsculas, números ou hífen')

export const walletProviderSchema = z.enum(WALLET_PROVIDERS)
export const walletSlotSchema = z.enum(WALLET_SLOTS)

export const userSchema = z.object({
  id: entityIdSchema,
  username: z.string(),
  displayName: z.string(),
  email: z.string(),
  ensName: z.string().nullable(),
  walletNickname: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  version: versionSchema,
})

export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: isoDateTimeSchema,
})

export const authResponseSchema = z.object({
  token: z.string().min(1),
  session: sessionSchema,
})

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha'),
})

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

export const registerRequestSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })

export const profileUpdateRequestSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe pelo menos 2 caracteres').max(40),
  username: usernameSchema,
  email: emailSchema,
  ensName: ensNameSchema,
  walletNickname: z.string().trim().min(2, 'Informe pelo menos 2 caracteres').max(30),
})

export const avatarUpdateRequestSchema = z.object({
  dataUrl: z
    .string()
    .max(MAX_AVATAR_DATA_URL_LENGTH, 'A imagem deve ter no máximo 512 KB')
    .regex(
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/,
      'Envie uma imagem PNG, JPG ou WebP',
    ),
})

export const passwordChangeRequestSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine(({ newPassword, confirmNewPassword }) => newPassword === confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'As senhas não coincidem',
  })
  .refine(({ currentPassword, newPassword }) => currentPassword !== newPassword, {
    path: ['newPassword'],
    message: 'A nova senha precisa ser diferente da atual',
  })

export const walletSchema = z.object({
  id: entityIdSchema,
  slot: walletSlotSchema,
  label: z.string(),
  nickname: z.string(),
  network: networkIdSchema,
  profileName: z.string(),
  address: z.string(),
  alternateAddress: z.string().nullable(),
  provider: walletProviderSchema,
  referralCode: z.string(),
  email: z.string(),
  ensName: z.string(),
  version: versionSchema,
  updatedAt: isoDateTimeSchema,
})

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const ENS_DOMAIN = /^[a-z0-9-]{3,32}(\.[a-z0-9-]{1,32})*\.eth$/

export function isValidWalletAddress(network: NetworkId, address: string) {
  return network === 'solana' ? SOLANA_ADDRESS.test(address) : EVM_ADDRESS.test(address)
}

export const walletUpsertRequestSchema = z
  .object({
    label: z.string().trim().min(2, 'Informe pelo menos 2 caracteres').max(40),
    nickname: z.string().trim().min(2, 'Informe pelo menos 2 caracteres').max(30),
    network: z.string().pipe(z.enum(NETWORK_IDS, { error: 'Selecione uma rede' })),
    profileName: z.string().trim().min(2, 'Informe pelo menos 2 caracteres').max(40),
    address: z.string().trim().min(1, 'Informe o endereço da carteira'),
    alternateAddress: z
      .string()
      .trim()
      .max(64, 'Use no máximo 64 caracteres')
      .transform((value) => value || null)
      .nullable(),
    provider: z.string().pipe(z.enum(WALLET_PROVIDERS, { error: 'Selecione uma carteira' })),
    referralCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{4,12}$/, 'Use de 4 a 12 letras ou números'),
    email: emailSchema,
    ensName: ensNameSchema,
  })
  .superRefine(({ network, address, alternateAddress }, context) => {
    if (address && !isValidWalletAddress(network, address)) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message:
          network === 'solana'
            ? 'Informe um endereço Solana válido'
            : 'Informe um endereço 0x com 40 caracteres hexadecimais',
      })
    }
    if (
      alternateAddress &&
      !ENS_DOMAIN.test(alternateAddress) &&
      !isValidWalletAddress(network, alternateAddress)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['alternateAddress'],
        message: 'Informe um nome ENS terminado em .eth ou um endereço válido',
      })
    }
  })

export const walletListResponseSchema = z.object({ items: z.array(walletSchema) })

export type WalletProvider = z.infer<typeof walletProviderSchema>
export type WalletSlot = z.infer<typeof walletSlotSchema>
export type User = z.infer<typeof userSchema>
export type Session = z.infer<typeof sessionSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>
export type ProfileUpdateRequest = z.infer<typeof profileUpdateRequestSchema>
export type AvatarUpdateRequest = z.infer<typeof avatarUpdateRequestSchema>
export type PasswordChangeRequest = z.infer<typeof passwordChangeRequestSchema>
export type Wallet = z.infer<typeof walletSchema>
export type WalletUpsertRequest = z.output<typeof walletUpsertRequestSchema>
export type WalletFormValues = z.input<typeof walletUpsertRequestSchema>
