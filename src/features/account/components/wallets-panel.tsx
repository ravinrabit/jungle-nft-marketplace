import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import type { Wallet, WalletFormValues } from '@/shared/api/contracts/account'
import { getErrorMessage } from '@/shared/api/api-error'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { walletsQueryOptions } from '../api/account-queries'
import { EMPTY_WALLET_VALUES, toWalletFormValues } from '../wallet-form-values'
import { WalletForm } from './wallet-form'

const ADD_BUTTON =
  'cursor-pointer text-base leading-4 font-medium text-text-accent hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-60'

function WalletsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando carteiras" className="flex flex-col gap-6">
      <Skeleton className="h-5 w-48" />
      <div className="grid gap-6 md:grid-cols-2 md:gap-x-7">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-[4.0625rem] w-full" />
        ))}
      </div>
    </div>
  )
}

function SameAsPrimaryToggle({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  const inputId = useId()
  return (
    <div className="flex items-center gap-2">
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="peer sr-only"
        onChange={onToggle}
      />
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center gap-2 text-sm leading-4 text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-4 items-center justify-center rounded-full border-[1.5px] border-primary',
            checked && 'after:size-2 after:rounded-full after:bg-primary',
          )}
        />
        Igual à carteira principal
      </label>
    </div>
  )
}

interface SecondaryWalletProps {
  userId: string
  primary: Wallet | undefined
  secondary: Wallet | undefined
}

function SecondaryWallet({ userId, primary, secondary }: SecondaryWalletProps) {
  const [draft, setDraft] = useState<{ values: WalletFormValues; version: number } | null>(null)
  const [isSameAsPrimary, setIsSameAsPrimary] = useState(false)
  const formValues = draft?.values ?? (secondary ? toWalletFormValues(secondary) : null)

  return (
    <section aria-labelledby="carteira-secundaria" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="carteira-secundaria"
          className="text-[1.0625rem] leading-4 font-bold text-foreground"
        >
          Carteira secundária
        </h2>
        <div className="flex items-center gap-5">
          <SameAsPrimaryToggle
            checked={isSameAsPrimary}
            disabled={!primary}
            onToggle={() => {
              const next = !isSameAsPrimary
              setIsSameAsPrimary(next)
              if (next && primary) {
                setDraft({ values: toWalletFormValues(primary), version: Date.now() })
              }
            }}
          />
          {!formValues && (
            <button
              type="button"
              className={ADD_BUTTON}
              onClick={() => {
                setDraft({ values: EMPTY_WALLET_VALUES, version: Date.now() })
              }}
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
      {formValues ? (
        <div className="pt-5">
          <WalletForm
            key={draft?.version ?? secondary?.id ?? 'nova'}
            userId={userId}
            slot="secondary"
            defaultValues={formValues}
          />
        </div>
      ) : (
        <p className="text-sm leading-[0.9375rem] text-text-secondary">
          Você ainda não adicionou uma carteira secundária.
        </p>
      )}
    </section>
  )
}

export function WalletsPanel({ userId }: { userId: string }) {
  const query = useQuery(walletsQueryOptions(userId))
  const [isAddingPrimary, setIsAddingPrimary] = useState(false)

  if (query.isPending) {
    return <WalletsSkeleton />
  }

  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p className="text-sm text-text-secondary">{getErrorMessage(query.error)}</p>
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  const primary = query.data.items.find((wallet) => wallet.slot === 'primary')
  const secondary = query.data.items.find((wallet) => wallet.slot === 'secondary')
  const showPrimaryForm = Boolean(primary) || isAddingPrimary

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8">
      <section aria-labelledby="carteira-principal" className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h1
              id="carteira-principal"
              className="text-[1.0625rem] leading-4 font-bold text-foreground"
            >
              Carteira principal
            </h1>
            <button
              type="button"
              disabled={showPrimaryForm}
              className={ADD_BUTTON}
              onClick={() => {
                setIsAddingPrimary(true)
              }}
            >
              Adicionar
            </button>
          </div>
          <p className="text-sm leading-[0.9375rem] text-text-secondary">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </header>
        {showPrimaryForm ? (
          <WalletForm
            key={primary?.id ?? 'nova'}
            userId={userId}
            slot="primary"
            defaultValues={primary ? toWalletFormValues(primary) : EMPTY_WALLET_VALUES}
          />
        ) : (
          <p className="text-sm text-text-secondary">
            Você ainda não adicionou uma carteira principal.
          </p>
        )}
      </section>
      <SecondaryWallet userId={userId} primary={primary} secondary={secondary} />
    </div>
  )
}
