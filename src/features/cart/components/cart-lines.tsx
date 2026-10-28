import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CartItem } from '@/shared/api/contracts/commerce'
import { getErrorMessage } from '@/shared/api/api-error'
import { formatEth } from '@/shared/lib/eth'
import { QuantityStepper } from '@/shared/ui/quantity-stepper'
import { EDITION_LABELS } from '@/features/catalog/catalog-labels'
import { NftArtwork } from '@/features/catalog/components/nft-artwork'
import { useRemoveCartItem, useUpdateCartItem } from '../api/cart-queries'

function limitOf(item: CartItem) {
  return Math.min(item.available, item.maxPerOrder)
}

function useLineActions(item: CartItem) {
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const isBusy = updateItem.isPending || removeItem.isPending

  const changeQuantity = (quantity: number) => {
    updateItem.mutate(
      { itemId: item.id, quantity },
      { onError: (error) => toast.error(getErrorMessage(error)) },
    )
  }

  const remove = () => {
    removeItem.mutate(item.id, {
      onSuccess: () => toast.success(`${item.name} foi removido do carrinho.`),
      onError: (error) => toast.error(getErrorMessage(error)),
    })
  }

  return { changeQuantity, remove, isBusy }
}

function LineNotices({ item }: { item: CartItem }) {
  const limit = limitOf(item)
  return (
    <>
      {item.priceChangedFrom && (
        <p className="text-xs leading-4 text-amber">
          Preço atualizado: antes {formatEth(item.priceChangedFrom)}
        </p>
      )}
      {limit === 0 && <p className="text-xs leading-4 text-text-coral">Edição esgotada</p>}
      {limit > 0 && item.quantity > limit && (
        <p className="text-xs leading-4 text-text-coral">Apenas {limit} disponível(is)</p>
      )}
    </>
  )
}

export function CartTableRow({ item }: { item: CartItem }) {
  const { changeQuantity, remove, isBusy } = useLineActions(item)

  return (
    <li className="flex min-h-[4.375rem] items-center justify-between bg-surface-card pr-6">
      <div className="flex w-[12.5rem] items-center gap-4 xl:w-[15.625rem]">
        <NftArtwork
          artwork={item.artwork}
          alt={item.imageAlt}
          sizes="70px"
          className="size-[4.375rem] shrink-0 rounded-md"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="truncate text-base leading-4 font-bold text-foreground">{item.name}</p>
          <p className="text-sm leading-4 text-price-muted">ID do token: {item.tokenId}</p>
          <p className="text-xs leading-4 text-text-secondary">
            Edição {EDITION_LABELS[item.editionKind]}
          </p>
        </div>
      </div>
      <div className="flex w-[4.8125rem] flex-col gap-1">
        <p className="text-base leading-4 font-bold text-text-secondary">
          <span className="sr-only">Preço unitário: </span>
          {formatEth(item.unitPrice)}
        </p>
        <LineNotices item={item} />
      </div>
      <QuantityStepper
        size="small"
        label={`Quantidade de ${item.name}`}
        value={item.quantity}
        max={Math.max(limitOf(item), item.quantity)}
        disabled={isBusy}
        onChange={changeQuantity}
        className="w-[4.6875rem]"
      />
      <p className="w-[5.4375rem] text-base leading-4 font-bold text-text-accent">
        <span className="sr-only">Total do item: </span>
        {formatEth(item.lineTotal)}
      </p>
      <button
        type="button"
        aria-label={`Remover ${item.name} do carrinho`}
        disabled={isBusy}
        className="flex size-6 cursor-pointer items-center justify-center text-text-secondary transition-colors hover:text-text-coral disabled:opacity-50"
        onClick={remove}
      >
        <Trash2 aria-hidden="true" className="size-5" />
      </button>
    </li>
  )
}

export function CartItemCard({ item }: { item: CartItem }) {
  const { changeQuantity, remove, isBusy } = useLineActions(item)

  return (
    <li className="flex min-h-[6.25rem] overflow-hidden rounded-[0.875rem] bg-linear-to-r from-surface-card to-surface-card/70">
      <NftArtwork
        artwork={item.artwork}
        alt={item.imageAlt}
        sizes="100px"
        className="size-[6.25rem] shrink-0 rounded-[0.875rem]"
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 py-3 pr-3 pl-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="truncate text-[0.9375rem] leading-4 font-bold text-foreground">
            {item.name}
          </p>
          <p className="text-sm leading-4 text-text-secondary">
            Edição: {EDITION_LABELS[item.editionKind]}
          </p>
          <p className="mt-2 text-lg leading-4 font-bold text-text-accent">
            <span className="sr-only">Total do item: </span>
            {formatEth(item.lineTotal)}
          </p>
          <LineNotices item={item} />
        </div>
        <QuantityStepper
          size="round"
          label={`Quantidade de ${item.name}`}
          value={item.quantity}
          max={Math.max(limitOf(item), item.quantity)}
          disabled={isBusy}
          onChange={changeQuantity}
          onRemove={remove}
          className="gap-2"
        />
      </div>
    </li>
  )
}
