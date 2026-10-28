import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useId, useState, type SubmitEvent } from 'react'
import type { Quote } from '@/shared/api/contracts/commerce'
import { cn } from '@/shared/lib/cn'
import { formatEth, isZeroEth } from '@/shared/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'

export interface CouponControls {
  appliedCode: string | undefined
  error: string | null
  isApplying: boolean
  apply: (code: string) => void
  remove: () => void
}

export interface CheckoutControls {
  isBlocked: boolean
  blockReason: string | null
  onCheckout: () => void
}

interface CartSummaryProps {
  quote: Quote | undefined
  isQuotePending: boolean
  isQuoteRefreshing: boolean
  coupon: CouponControls
  checkout: CheckoutControls
}

function formatDiscount(discount: string) {
  return isZeroEth(discount) ? '(-) 00.00' : `(-) ${formatEth(discount)}`
}

function CouponForm({
  coupon,
  variant,
}: {
  coupon: CouponControls
  variant: 'desktop' | 'mobile'
}) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [code, setCode] = useState('')

  if (coupon.appliedCode) {
    return (
      <p
        role="status"
        className="flex items-center justify-between gap-3 rounded-[0.1875rem] border border-success/50 px-3 py-2.5 text-sm text-foreground"
      >
        <span>
          Cupom <strong className="text-text-accent">{coupon.appliedCode}</strong> aplicado
        </span>
        <button
          type="button"
          className="cursor-pointer text-sm text-text-accent underline-offset-2 hover:underline"
          onClick={coupon.remove}
        >
          Remover
        </button>
      </p>
    )
  }

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = code.trim().toUpperCase()
    if (normalized) {
      coupon.apply(normalized)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={cn(
          'text-sm leading-4 font-bold text-foreground',
          variant === 'mobile' && 'sr-only',
        )}
      >
        Código promocional
      </label>
      <div
        className={cn(
          'flex overflow-hidden border',
          variant === 'desktop'
            ? 'h-10 rounded-[0.1875rem] border-primary'
            : 'h-[3.125rem] rounded-[2.5rem] border-border bg-surface-card',
          coupon.error && 'border-error',
        )}
      >
        <input
          id={inputId}
          value={code}
          autoComplete="off"
          maxLength={32}
          placeholder="Digite o código promocional..."
          aria-invalid={coupon.error ? true : undefined}
          aria-describedby={coupon.error ? errorId : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-foreground uppercase outline-none placeholder:text-price-muted placeholder:normal-case focus-visible:bg-surface-raised',
            variant === 'desktop'
              ? 'pl-2 text-xs leading-4'
              : 'pl-4 text-[0.8125rem] leading-[1.375rem]',
          )}
          onChange={(event) => {
            setCode(event.target.value)
          }}
        />
        <button
          type="submit"
          disabled={coupon.isApplying}
          className={cn(
            'flex shrink-0 cursor-pointer items-center justify-center gap-1 text-[0.9375rem] leading-4 font-bold disabled:cursor-wait disabled:opacity-70',
            variant === 'desktop'
              ? 'w-[6.375rem] rounded-tr-[0.1875rem] rounded-br-[0.1875rem] bg-primary text-ink hover:bg-primary-light'
              : 'w-[6.0625rem] rounded-[2.5rem] bg-primary/55 text-foreground hover:bg-primary/70',
          )}
        >
          {coupon.isApplying && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          Aplicar
        </button>
      </div>
      {coupon.error && (
        <p id={errorId} role="alert" className="text-xs leading-4 text-text-coral">
          {coupon.error}
        </p>
      )}
    </form>
  )
}

function SummaryRows({
  quote,
  isPending,
  variant,
}: {
  quote: Quote | undefined
  isPending: boolean
  variant: 'desktop' | 'mobile'
}) {
  const valueSize = variant === 'desktop' ? 'text-lg' : 'text-base'

  if (isPending || !quote) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-5 w-full" />
        ))}
      </div>
    )
  }

  return (
    <dl className="flex flex-col gap-3 text-[0.9375rem] leading-none text-foreground">
      <div className="flex items-center justify-between">
        <dt>Subtotal</dt>
        <dd className={cn(valueSize, 'leading-4')}>{formatEth(quote.subtotal)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt>Desconto do lançamento</dt>
        <dd>{formatDiscount(quote.discount)}</dd>
      </div>
      <div className="flex flex-col gap-3 lg:gap-3">
        <div className="flex items-center justify-between">
          <dt>Taxa de rede</dt>
          <dd className={cn(valueSize, 'leading-4')}>{formatEth(quote.networkFee)}</dd>
        </div>
        <p className="self-end text-xs leading-4 text-text-accent lg:self-end">Taxa estimada</p>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-base leading-4 font-bold">Total</dt>
        <dd className="text-lg leading-4 font-bold text-text-accent">{formatEth(quote.total)}</dd>
      </div>
    </dl>
  )
}

function CheckoutButton({
  checkout,
  variant,
}: {
  checkout: CheckoutControls
  variant: 'desktop' | 'mobile'
}) {
  const reasonId = useId()
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={checkout.isBlocked}
        aria-describedby={checkout.blockReason ? reasonId : undefined}
        onClick={checkout.onCheckout}
        className={cn(
          'w-full cursor-pointer font-bold text-ink transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          variant === 'desktop'
            ? 'h-10 rounded-[0.1875rem] bg-primary text-[0.9375rem] leading-4 hover:bg-primary-light'
            : 'h-[3.75rem] rounded-[2.5rem] bg-primary/80 text-base leading-4 hover:bg-primary',
        )}
      >
        Conectar e finalizar
      </button>
      {checkout.blockReason && (
        <p id={reasonId} className="text-xs leading-4 text-text-coral">
          {checkout.blockReason}
        </p>
      )}
    </div>
  )
}

export function DesktopCartSummary(props: CartSummaryProps) {
  return (
    <aside
      aria-labelledby="resumo-carteira"
      aria-busy={props.isQuoteRefreshing}
      className="hidden w-[20.75rem] shrink-0 flex-col gap-6 lg:flex"
    >
      <div className="flex flex-col gap-3">
        <h2 id="resumo-carteira" className="text-lg leading-4 font-bold text-foreground">
          Resumo da carteira
        </h2>
        <div aria-hidden="true" className="h-px bg-primary/40" />
      </div>
      <CouponForm coupon={props.coupon} variant="desktop" />
      <SummaryRows quote={props.quote} isPending={props.isQuotePending} variant="desktop" />
      <div className="flex flex-col gap-3">
        <CheckoutButton checkout={props.checkout} variant="desktop" />
        <Link
          to="/"
          hash="catalogo"
          className="text-center text-[0.9375rem] leading-none text-text-accent hover:underline"
        >
          Continuar explorando
        </Link>
      </div>
    </aside>
  )
}

export function MobileCartSummary(props: CartSummaryProps) {
  return (
    <section
      aria-label="Resumo do pagamento"
      aria-busy={props.isQuoteRefreshing}
      className="-mx-6 flex flex-col gap-3 rounded-t-[2.5rem] bg-surface-card px-6 pt-6 pb-9 lg:hidden"
    >
      <CouponForm coupon={props.coupon} variant="mobile" />
      <SummaryRows quote={props.quote} isPending={props.isQuotePending} variant="mobile" />
      <div className="pt-6">
        <CheckoutButton checkout={props.checkout} variant="mobile" />
      </div>
    </section>
  )
}
