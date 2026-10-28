import { Link } from '@tanstack/react-router'
import { useId } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { WALLET_PROVIDERS, type Wallet } from '@/shared/api/contracts/account'
import { NETWORK_IDS } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import {
  AccountSelectField,
  AccountTextField,
  EnsNameField,
} from '@/features/account/components/account-fields'
import { WALLET_PROVIDER_LABELS } from '@/features/account/wallet-form-values'
import { NETWORK_LABELS } from '@/features/catalog/catalog-labels'
import type { CheckoutFormValues, CheckoutSubmission } from '../checkout-form'

const NETWORK_OPTIONS = NETWORK_IDS.map((id) => ({ value: id, label: NETWORK_LABELS[id] }))
const PROVIDER_OPTIONS = WALLET_PROVIDERS.map((id) => ({
  value: id,
  label: WALLET_PROVIDER_LABELS[id],
}))

export type CheckoutForm = UseFormReturn<CheckoutFormValues, unknown, CheckoutSubmission>

interface CollectorFieldsProps {
  form: CheckoutForm
  wallet: Wallet | undefined
  wallets: readonly Wallet[]
  onWalletChange: (walletId: string) => void
}

function AlternateWalletToggle({
  wallet,
  wallets,
  onWalletChange,
}: Omit<CollectorFieldsProps, 'form'>) {
  const inputId = useId()
  const alternate = wallets.find((candidate) => candidate.id !== wallet?.id)
  const primary = wallets[0]

  if (!alternate || !primary) {
    return (
      <Link
        to="/perfil/carteiras"
        search={{ retorno: 'pagamento' }}
        className="flex items-center gap-2.5 self-start text-[0.9375rem] leading-4 text-foreground hover:text-text-accent"
      >
        <span aria-hidden="true" className="size-4 rounded-full border border-primary" />
        Usar outra carteira?
      </Link>
    )
  }

  const isUsingAlternate = wallet?.id !== primary.id

  return (
    <div className="flex items-center gap-2.5">
      <input
        id={inputId}
        type="checkbox"
        checked={isUsingAlternate}
        className="peer sr-only"
        onChange={(event) => {
          onWalletChange(event.target.checked ? alternate.id : primary.id)
        }}
      />
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center gap-2.5 text-[0.9375rem] leading-4 text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary"
      >
        <span
          aria-hidden="true"
          className="flex size-4 items-center justify-center rounded-full border border-primary"
        >
          <span className={cn('size-2 rounded-full bg-primary', !isUsingAlternate && 'hidden')} />
        </span>
        Usar outra carteira?
        <span className="sr-only">
          {isUsingAlternate
            ? ` Usando a carteira ${wallet?.label ?? ''}.`
            : ` A carteira ${alternate.label} será usada.`}
        </span>
      </label>
    </div>
  )
}

export function CollectorFields({ form, wallet, wallets, onWalletChange }: CollectorFieldsProps) {
  const { errors } = form.formState
  const noteId = useId()

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <AccountTextField
          label="Nome de exibição"
          required
          autoComplete="name"
          error={errors.displayName?.message}
          {...form.register('displayName')}
        />
        <AccountTextField
          label="Nome de usuário"
          required
          autoComplete="username"
          error={errors.username?.message}
          {...form.register('username')}
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
          readOnly
          value={wallet?.address ?? ''}
          spellCheck={false}
          hint="Definido pela carteira selecionada"
          error={errors.walletId?.message}
        />
        <AccountTextField
          label="ENS ou carteira secundária (opcional)"
          readOnly
          value={wallet?.alternateAddress ?? ''}
          placeholder="ENS ou carteira secundária (opcional)"
          spellCheck={false}
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

      <div className="hidden lg:flex">
        <AlternateWalletToggle wallet={wallet} wallets={wallets} onWalletChange={onWalletChange} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={noteId} className="text-[0.9375rem] leading-4 text-foreground">
          Observação do colecionador (opcional)
        </label>
        <textarea
          id={noteId}
          maxLength={280}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={errors.note ? `${noteId}-error` : undefined}
          className="h-[9.5rem] w-full max-w-[21.875rem] resize-none rounded-[0.1875rem] border border-border bg-transparent p-3 text-sm leading-5 text-foreground outline-none placeholder:text-price-muted focus-visible:border-primary aria-invalid:border-error"
          {...form.register('note')}
        />
        {errors.note && (
          <p id={`${noteId}-error`} className="text-xs leading-4 text-text-coral">
            {errors.note.message}
          </p>
        )}
      </div>
    </div>
  )
}
