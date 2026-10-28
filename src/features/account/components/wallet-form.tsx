import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  WALLET_PROVIDERS,
  walletUpsertRequestSchema,
  type WalletFormValues,
  type WalletSlot,
  type WalletUpsertRequest,
} from '@/shared/api/contracts/account'
import { NETWORK_IDS } from '@/shared/api/contracts/catalog'
import { getErrorMessage } from '@/shared/api/api-error'
import { applyServerFieldErrors } from '@/features/auth/apply-server-errors'
import { NETWORK_LABELS } from '@/features/catalog/catalog-labels'
import { useSaveWallet } from '../api/account-queries'
import { toWalletFormValues, WALLET_PROVIDER_LABELS } from '../wallet-form-values'
import { AccountSelectField, AccountTextField, EnsNameField } from './account-fields'

const NETWORK_OPTIONS = NETWORK_IDS.map((id) => ({ value: id, label: NETWORK_LABELS[id] }))
const PROVIDER_OPTIONS = WALLET_PROVIDERS.map((id) => ({
  value: id,
  label: WALLET_PROVIDER_LABELS[id],
}))

const WALLET_FIELDS = [
  'label',
  'nickname',
  'network',
  'profileName',
  'address',
  'alternateAddress',
  'provider',
  'referralCode',
  'email',
  'ensName',
] as const

interface WalletFormProps {
  userId: string
  slot: WalletSlot
  defaultValues: WalletFormValues
  onSaved?: (() => void) | undefined
}

const SLOT_LABELS: Record<WalletSlot, string> = {
  primary: 'Carteira principal',
  secondary: 'Carteira secundária',
}

export function WalletForm({ userId, slot, defaultValues, onSaved }: WalletFormProps) {
  const saveWallet = useSaveWallet(userId, slot)
  const form = useForm<WalletFormValues, unknown, WalletUpsertRequest>({
    resolver: zodResolver(walletUpsertRequestSchema),
    defaultValues,
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    try {
      const saved = await saveWallet.mutateAsync(values)
      form.reset(toWalletFormValues(saved))
      toast.success(`${SLOT_LABELS[slot]} salva.`)
      onSaved?.()
    } catch (error) {
      if (!applyServerFieldErrors(error, WALLET_FIELDS, form.setError)) {
        toast.error(getErrorMessage(error))
      }
    }
  })

  return (
    <form
      noValidate
      aria-label={SLOT_LABELS[slot]}
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-8"
    >
      <div className="grid items-end gap-6 md:grid-cols-2 md:gap-x-7">
        <AccountTextField
          label="Nome de exibição"
          required
          error={errors.label?.message}
          {...form.register('label')}
        />
        <AccountTextField
          label="Apelido da carteira"
          required
          error={errors.nickname?.message}
          {...form.register('nickname')}
        />
        <Controller
          control={form.control}
          name="network"
          render={({ field }) => (
            <AccountSelectField
              label="Rede"
              required
              placeholder="Selecione uma rede"
              options={NETWORK_OPTIONS}
              value={field.value}
              error={errors.network?.message}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <AccountTextField
          label="Nome do perfil"
          required
          error={errors.profileName?.message}
          {...form.register('profileName')}
        />
        <AccountTextField
          label="Endereço da carteira"
          required
          placeholder="Endereço 0x da carteira"
          autoComplete="off"
          spellCheck={false}
          error={errors.address?.message}
          {...form.register('address')}
        />
        <AccountTextField
          label="ENS ou carteira secundária (opcional)"
          placeholder="ENS ou carteira secundária (opcional)"
          autoComplete="off"
          spellCheck={false}
          className="placeholder:text-price-muted"
          error={errors.alternateAddress?.message}
          {...form.register('alternateAddress')}
        />
        <Controller
          control={form.control}
          name="provider"
          render={({ field }) => (
            <AccountSelectField
              label="Tipo de carteira"
              required
              placeholder="Selecione uma carteira"
              options={PROVIDER_OPTIONS}
              value={field.value}
              error={errors.provider?.message}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <AccountTextField
          label="Código de indicação"
          required
          autoComplete="off"
          error={errors.referralCode?.message}
          {...form.register('referralCode')}
        />
        <AccountTextField
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <EnsNameField
          label="Nome ENS"
          required
          autoComplete="off"
          error={errors.ensName?.message}
          {...form.register('ensName')}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="flex h-10 min-w-[8.1875rem] cursor-pointer items-center justify-center gap-2 self-start rounded-[0.1875rem] bg-primary px-1 text-sm leading-4 font-bold text-ink hover:bg-primary-light disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Salvar carteira
      </button>
    </form>
  )
}
