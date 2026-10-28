import type { QuoteLine } from '@/shared/api/contracts/commerce'
import { cn } from '@/shared/lib/cn'
import { formatEth, formatEthDiscount } from '@/shared/lib/eth'
import { NftArtwork } from '@/features/catalog/components/nft-artwork'
import { EDITION_LABELS } from '@/features/catalog/catalog-labels'

interface Totals {
  subtotal: string
  discount: string
  networkFee: string
  total: string
}

interface OrderTotalsProps {
  totals: Totals
  showEstimate?: boolean
  className?: string
}

export function OrderTotals({ totals, showEstimate = false, className }: OrderTotalsProps) {
  return (
    <dl className={cn('flex flex-col gap-3 text-[0.9375rem] leading-4 text-foreground', className)}>
      <div className="flex items-center justify-between">
        <dt>Subtotal</dt>
        <dd className="text-lg">{formatEth(totals.subtotal)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt>Desconto</dt>
        <dd>{formatEthDiscount(totals.discount)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt>Taxa de rede</dt>
        <dd className="text-lg">{formatEth(totals.networkFee)}</dd>
      </div>
      {showEstimate && <p className="text-center text-xs text-text-accent">Taxa estimada</p>}
      <div aria-hidden="true" className="h-px bg-primary/40" />
      <div className="flex items-center justify-between">
        <dt className="text-base font-bold">Total</dt>
        <dd className="text-lg font-bold text-text-accent">{formatEth(totals.total)}</dd>
      </div>
    </dl>
  )
}

interface OrderLineItemProps {
  line: QuoteLine
  showEditionColumn?: boolean
}

export function OrderLineItem({ line, showEditionColumn = false }: OrderLineItemProps) {
  return (
    <li className="flex min-h-[4.375rem] items-center justify-between gap-3 bg-surface-card pr-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <NftArtwork
          artwork={line.artwork}
          alt={line.imageAlt}
          sizes="70px"
          className="size-[4.375rem] shrink-0 rounded-[0.5rem]"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="truncate text-base leading-4 font-bold text-foreground">{line.name}</p>
          <p className="text-sm leading-4 text-price-muted">ID do token: {line.tokenId}</p>
          <p
            className={cn(
              'text-sm leading-4 text-text-secondary',
              showEditionColumn && 'sm:hidden',
            )}
          >
            <span className="sr-only">Edição {EDITION_LABELS[line.editionKind]}, quantidade </span>
            (x {line.quantity})
          </p>
        </div>
      </div>
      {showEditionColumn && (
        <p className="hidden w-16 shrink-0 text-center text-sm leading-4 text-text-secondary sm:block">
          <span className="sr-only">Edição {EDITION_LABELS[line.editionKind]}, quantidade </span>
          {line.quantity}
        </p>
      )}
      <p className="shrink-0 text-lg leading-4 font-bold text-text-accent">
        <span className="sr-only">Subtotal: </span>
        {formatEth(line.lineTotal)}
      </p>
    </li>
  )
}
