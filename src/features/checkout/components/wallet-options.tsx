import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { WALLET_PROVIDERS, type Wallet, type WalletProvider } from '@/shared/api/contracts/account'
import { shortenAddress } from '@/shared/lib/address'
import { cn } from '@/shared/lib/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { WALLET_PROVIDER_LABELS } from '@/features/account/wallet-form-values'
import { NETWORK_LABELS } from '@/features/catalog/catalog-labels'

const PROVIDER_ORDER: readonly WalletProvider[] = ['walletconnect', 'metamask', 'coinbase']
const PROVIDER_BADGE = WALLET_PROVIDERS.map((provider) => provider.toUpperCase()).join(' • ')

function RadioDot({ isChecked }: { isChecked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary"
    >
      <span className={cn('size-2 rounded-full bg-primary', !isChecked && 'hidden')} />
    </span>
  )
}

interface RadioCardProps {
  name: string
  value: string
  isChecked: boolean
  onSelect: (value: string) => void
  className: string
  children: ReactNode
}

function RadioCard({ name, value, isChecked, onSelect, className, children }: RadioCardProps) {
  const inputId = useId()
  return (
    <div className="relative">
      <input
        id={inputId}
        type="radio"
        name={name}
        value={value}
        checked={isChecked}
        className="peer sr-only"
        onChange={() => {
          onSelect(value)
        }}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'flex cursor-pointer items-center border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
          isChecked ? 'border-primary' : 'border-border hover:border-border-soft',
          className,
        )}
      >
        {children}
      </label>
    </div>
  )
}

interface ProviderOptionsProps {
  value: string
  onChange: (provider: string) => void
}

export function ProviderOptions({ value, onChange }: ProviderOptionsProps) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-3 lg:gap-2.5">
      <legend className="mb-3 text-base leading-4 font-bold text-foreground lg:mb-4 lg:w-full lg:text-center lg:text-[1.0625rem]">
        Carteira e rede
      </legend>
      {PROVIDER_ORDER.map((provider) => {
        const label = WALLET_PROVIDER_LABELS[provider]
        return (
          <RadioCard
            key={provider}
            name={name}
            value={provider}
            isChecked={value === provider}
            onSelect={onChange}
            className="h-[4.0625rem] gap-3 rounded-[0.9375rem] bg-surface-card px-3 lg:h-[2.8125rem] lg:rounded-[0.1875rem] lg:bg-transparent lg:px-4"
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-base font-bold text-text-accent lg:hidden"
            >
              {label.charAt(0)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm leading-4 text-foreground lg:text-[0.9375rem]">{label}</span>
              {provider === 'walletconnect' && (
                <span className="hidden truncate text-[0.625rem] leading-3 tracking-wide text-price-muted lg:block">
                  {PROVIDER_BADGE}
                </span>
              )}
            </span>
            <RadioDot isChecked={value === provider} />
          </RadioCard>
        )
      })}
    </fieldset>
  )
}

interface WalletCardsProps {
  wallets: readonly Wallet[]
  value: string
  onChange: (walletId: string) => void
}

export function WalletCards({ wallets, value, onChange }: WalletCardsProps) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-3">
      <div className="mb-1 flex items-center justify-between">
        <legend className="text-base leading-4 font-bold text-foreground">
          Carteira conectada
        </legend>
        <Link
          to="/perfil/carteiras"
          search={{ retorno: 'pagamento' }}
          className="text-sm leading-4 font-bold text-text-accent hover:underline"
        >
          Trocar carteira
        </Link>
      </div>
      {wallets.map((wallet) => (
        <div key={wallet.id} className="relative">
          <RadioCard
            name={name}
            value={wallet.id}
            isChecked={value === wallet.id}
            onSelect={onChange}
            className="min-h-[5.8125rem] gap-3 rounded-[0.875rem] bg-surface-card py-3 pr-12 pl-4"
          >
            <RadioDot isChecked={value === wallet.id} />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-base leading-4 font-bold text-foreground">
                {wallet.label} · {WALLET_PROVIDER_LABELS[wallet.provider]}
              </span>
              <span className="text-sm leading-[1.375rem] text-text-secondary">
                {wallet.alternateAddress ?? shortenAddress(wallet.address)}
                <br />
                Rede {NETWORK_LABELS[wallet.network]}
              </span>
            </span>
          </RadioCard>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Opções da carteira ${wallet.label}`}
              className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:text-text-accent"
            >
              <EllipsisVertical aria-hidden="true" className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border bg-surface-card">
              <DropdownMenuItem asChild>
                <Link to="/perfil/carteiras" search={{ retorno: 'pagamento' }}>
                  Editar carteira
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </fieldset>
  )
}
