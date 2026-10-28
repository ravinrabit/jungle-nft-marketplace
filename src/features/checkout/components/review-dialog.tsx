import { Loader2 } from 'lucide-react'
import { shortenAddress } from '@/shared/lib/address'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { WALLET_PROVIDER_LABELS } from '@/features/account/wallet-form-values'
import { NETWORK_LABELS } from '@/features/catalog/catalog-labels'
import type { CheckoutReview } from '../use-checkout-flow'
import { OrderLineItem, OrderTotals } from './order-totals'

interface ReviewDialogProps {
  review: CheckoutReview | null
  error: string | null
  isSubmitting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ReviewDialog({
  review,
  error,
  isSubmitting,
  onConfirm,
  onCancel,
}: ReviewDialogProps) {
  return (
    <Dialog
      open={review !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel()
        }
      }}
    >
      {review && (
        <DialogContent
          showCloseButton={!isSubmitting}
          aria-busy={isSubmitting}
          className="max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] gap-6 overflow-y-auto rounded-lg border-border bg-surface-card text-foreground sm:max-w-[36.125rem]"
          onEscapeKeyDown={(event) => {
            if (isSubmitting) {
              event.preventDefault()
            }
          }}
          onInteractOutside={(event) => {
            if (isSubmitting) {
              event.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Revise e assine a compra</DialogTitle>
            <DialogDescription className="text-sm leading-[1.375rem] text-text-secondary">
              {WALLET_PROVIDER_LABELS[review.connection.provider]} conectada em{' '}
              {shortenAddress(review.connection.address)} na rede{' '}
              {NETWORK_LABELS[review.connection.network]}.
            </DialogDescription>
          </DialogHeader>

          {review.notice && (
            <p
              role="alert"
              className="rounded-md border border-amber/50 bg-amber/10 px-4 py-3 text-sm leading-5 text-foreground"
            >
              {review.notice}
            </p>
          )}

          <ul aria-label="Itens do pedido" className="flex flex-col gap-3">
            {review.quote.lines.map((line) => (
              <OrderLineItem key={line.cartItemId} line={line} />
            ))}
          </ul>

          <OrderTotals totals={review.quote} />

          {error && (
            <p role="alert" className="text-sm leading-5 text-text-coral">
              {error}
            </p>
          )}

          <DialogFooter className="gap-3 sm:justify-between">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="h-11 cursor-pointer rounded-[0.5rem] border border-border px-6 text-[0.9375rem] font-bold text-foreground hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onConfirm}
              className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[0.5rem] bg-primary px-6 text-[0.9375rem] font-bold text-ink hover:bg-primary-light disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {isSubmitting ? 'Aguardando a carteira…' : 'Assinar e confirmar'}
            </button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
