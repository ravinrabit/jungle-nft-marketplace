import { zodResolver } from '@hookform/resolvers/zod'
import { keepPreviousData, useIsMutating, useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { User, Wallet } from '@/shared/api/contracts/account'
import { networkIdSchema } from '@/shared/api/contracts/catalog'
import type { Cart, Quote } from '@/shared/api/contracts/commerce'
import { getErrorMessage } from '@/shared/api/api-error'
import { shortenAddress } from '@/shared/lib/address'
import { cn } from '@/shared/lib/cn'
import { formatEth } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'
import { MarketBreadcrumb, MobilePageHeader } from '@/shared/ui/page-heading'
import { Skeleton } from '@/shared/ui/skeleton'
import { walletsQueryOptions } from '@/features/account/api/account-queries'
import { WALLET_PROVIDER_LABELS } from '@/features/account/wallet-form-values'
import { useSession } from '@/features/auth/api/auth-queries'
import { quoteQueryOptions, useCart, type CartOwnerKey } from '@/features/cart/api/cart-queries'
import { CatalogMessage } from '@/features/catalog/components/nft-grid'
import { activeOrderQueryOptions, checkoutKeys } from '../api/checkout-queries'
import {
  CHECKOUT_FIELDS,
  checkoutFormSchema,
  createCheckoutDefaults,
  walletDefaults,
  type CheckoutFormValues,
  type CheckoutSubmission,
} from '../checkout-form'
import { checkoutDraft } from '../checkout-storage'
import { useCheckoutFlow } from '../use-checkout-flow'
import { CollectorFields } from './collector-fields'
import { OrderLineItem, OrderTotals } from './order-totals'
import { ReviewDialog } from './review-dialog'
import { ProviderOptions, WalletCards } from './wallet-options'

const routeApi = getRouteApi('/pagamento')

const BLOCKING_ISSUES = new Set(['UNAVAILABLE', 'AVAILABILITY_REDUCED'])

function CheckoutSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando pagamento"
      className="flex flex-col gap-8 lg:min-h-dvh lg:flex-row lg:justify-between"
    >
      <div className="grid gap-6 md:grid-cols-2 lg:w-[47.6875rem]">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-[4.3125rem] w-full" />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:w-[25.3125rem]">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[4.375rem] w-full" />
        ))}
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[2.8125rem] w-full" />
      </div>
    </div>
  )
}

function resolveDefaults(user: User, wallets: readonly Wallet[]) {
  const draft = checkoutDraft.read(user.id)
  if (draft && wallets.some((wallet) => wallet.id === draft.walletId)) {
    return draft
  }
  return createCheckoutDefaults(user, wallets[0])
}

function blockReasonFor(quote: Quote | undefined) {
  if (!quote) {
    return 'Aguardando a cotação atualizada.'
  }
  return quote.issues.some((issue) => BLOCKING_ISSUES.has(issue.type))
    ? 'Há itens sem disponibilidade. Ajuste o carrinho antes de continuar.'
    : null
}

interface CheckoutFormProps {
  user: User
  wallets: readonly Wallet[]
  cart: Cart
  owner: CartOwnerKey
  couponCode: string | null
}

function CheckoutForm({ user, wallets, cart, owner, couponCode }: CheckoutFormProps) {
  const [defaults] = useState(() => resolveDefaults(user, wallets))
  const form = useForm<CheckoutFormValues, unknown, CheckoutSubmission>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: defaults,
  })
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileId = useId()
  const reasonId = useId()

  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values }) => {
          checkoutDraft.write(user.id, values)
        },
      }),
    [form, user.id],
  )

  const [walletId, network] = useWatch({ control: form.control, name: ['walletId', 'network'] })
  const wallet = wallets.find((candidate) => candidate.id === walletId)
  const quoteNetwork = networkIdSchema.safeParse(network).data ?? null

  const quoteQuery = useQuery({
    ...quoteQueryOptions(owner, cart.version, { couponCode, network: quoteNetwork }),
    placeholderData: keepPreviousData,
  })

  const flow = useCheckoutFlow({
    userId: user.id,
    owner,
    cartVersion: cart.version,
    couponCode,
    onFieldError: (field, message) => {
      setIsProfileOpen(true)
      form.setError(field, { type: 'server', message })
    },
  })

  const changeWallet = (nextId: string) => {
    const next = wallets.find((candidate) => candidate.id === nextId)
    if (!next) {
      return
    }
    for (const [field, value] of Object.entries(walletDefaults(next))) {
      form.setValue(field as keyof CheckoutFormValues, value, {
        shouldDirty: true,
        shouldValidate: form.formState.isSubmitted,
      })
    }
  }

  const submit = form.handleSubmit(
    (values) => flow.prepare(values),
    (errors) => {
      setIsProfileOpen(true)
      const firstInvalid = CHECKOUT_FIELDS.find((field) => errors[field])
      if (firstInvalid) {
        requestAnimationFrame(() => {
          form.setFocus(firstInvalid)
        })
      }
    },
  )

  const quote = quoteQuery.data
  const blockReason = blockReasonFor(quote)
  const isBusy = flow.isPreparing || flow.isSubmitting
  const isConfirmDisabled = isBusy || blockReason !== null || quoteQuery.isFetching

  return (
    <>
      <form
        noValidate
        aria-label="Pagamento com carteira"
        onSubmit={(event) => void submit(event)}
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_auto_1fr] lg:justify-between lg:gap-x-8 lg:gap-y-8 xl:grid-cols-[minmax(0,47.6875rem)_25.3125rem]"
      >
        <div className="lg:hidden">
          <Controller
            control={form.control}
            name="walletId"
            render={({ field }) => (
              <WalletCards wallets={wallets} value={field.value} onChange={changeWallet} />
            )}
          />
        </div>

        <section
          aria-labelledby={`${profileId}-title`}
          className="flex flex-col gap-6 lg:col-start-1 lg:row-span-3 lg:row-start-1"
        >
          <h2
            id={`${profileId}-title`}
            className="hidden text-[1.0625rem] leading-4 font-bold text-foreground lg:block"
          >
            Perfil do colecionador
          </h2>
          <button
            type="button"
            aria-expanded={isProfileOpen}
            aria-controls={profileId}
            className="flex cursor-pointer items-center justify-between rounded-[0.875rem] bg-surface-card px-4 py-4 text-base leading-4 font-bold text-foreground lg:hidden"
            onClick={() => {
              setIsProfileOpen((current) => !current)
            }}
          >
            Perfil do colecionador
            <ChevronDown
              aria-hidden="true"
              className={cn('size-5 transition-transform', isProfileOpen && 'rotate-180')}
            />
          </button>
          <div id={profileId} className={cn(!isProfileOpen && 'hidden', 'lg:block')}>
            <CollectorFields
              form={form}
              wallet={wallet}
              wallets={wallets}
              onWalletChange={changeWallet}
            />
          </div>
        </section>

        <section
          aria-labelledby={`${profileId}-items`}
          aria-busy={quoteQuery.isFetching}
          className="hidden flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:flex"
        >
          <h2
            id={`${profileId}-items`}
            className="text-[1.0625rem] leading-4 font-bold text-foreground"
          >
            Seus NFTs
          </h2>
          <div
            aria-hidden="true"
            className="flex justify-between text-base leading-4 font-bold text-foreground"
          >
            <span>NFTs</span>
            <span>Subtotal</span>
          </div>
          <div aria-hidden="true" className="h-px bg-primary/40" />
          {quote ? (
            <>
              <ul aria-label="Itens da compra" className="flex flex-col gap-3">
                {quote.lines.map((line) => (
                  <OrderLineItem key={line.cartItemId} line={line} />
                ))}
              </ul>
              <p className="text-center text-sm leading-4 text-foreground">
                Tem um código promocional?{' '}
                <Link
                  to="/carrinho"
                  search={{ cupom: couponCode ?? undefined }}
                  className="text-text-accent hover:underline"
                >
                  Aplique aqui
                </Link>
              </p>
              <OrderTotals totals={quote} showEstimate />
            </>
          ) : quoteQuery.isError ? (
            <p role="alert" className="text-sm text-text-coral">
              {getErrorMessage(quoteQuery.error)}
            </p>
          ) : (
            <div aria-hidden="true" className="flex flex-col gap-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </div>
          )}
        </section>

        <div className="lg:col-start-2 lg:row-start-2">
          <Controller
            control={form.control}
            name="provider"
            render={({ field }) => (
              <ProviderOptions value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-3">
          <p className="flex items-center justify-between text-base leading-4 font-bold text-foreground lg:hidden">
            Total:
            <span className="text-lg text-text-accent">{quote ? formatEth(quote.total) : '—'}</span>
          </p>

          {flow.connection && (
            <div className="flex items-center justify-between gap-3 text-sm leading-5 text-text-secondary">
              <p role="status">
                Conectada: {WALLET_PROVIDER_LABELS[flow.connection.provider]} ·{' '}
                {shortenAddress(flow.connection.address)}
              </p>
              <button
                type="button"
                className="cursor-pointer text-text-accent hover:underline"
                onClick={flow.disconnect}
              >
                Desconectar
              </button>
            </div>
          )}

          {quoteQuery.isError && !quote && (
            <p role="alert" className="text-sm leading-5 text-text-coral lg:hidden">
              {getErrorMessage(quoteQuery.error)}
            </p>
          )}

          {flow.error && !flow.review && (
            <p role="alert" className="text-sm leading-5 text-text-coral">
              {flow.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isConfirmDisabled}
            aria-describedby={blockReason ? reasonId : undefined}
            className="flex h-[3.75rem] w-full cursor-pointer items-center justify-center gap-2 rounded-[2.5rem] bg-primary/80 text-base leading-4 font-bold text-ink transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50 lg:h-[2.8125rem] lg:rounded-[0.5rem] lg:bg-primary lg:text-[0.9375rem] lg:hover:bg-primary-light"
          >
            {flow.isPreparing && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {flow.isPreparing ? 'Conectando a carteira…' : 'Confirmar compra'}
          </button>
          {blockReason && quote && (
            <p id={reasonId} className="text-xs leading-4 text-text-coral">
              {blockReason}{' '}
              <Link to="/carrinho" className="text-text-accent underline">
                Revisar carrinho
              </Link>
            </p>
          )}
        </div>
      </form>

      <ReviewDialog
        review={flow.review}
        error={flow.error}
        isSubmitting={flow.isSubmitting}
        onConfirm={flow.confirm}
        onCancel={flow.cancelReview}
      />
    </>
  )
}

function CheckoutContent({ user, couponCode }: { user: User; couponCode: string | null }) {
  const walletsQuery = useQuery(walletsQueryOptions(user.id))
  const activeOrderQuery = useQuery(activeOrderQueryOptions(user.id))
  const { owner, query: cartQuery } = useCart()
  const isPlacingOrder = useIsMutating({ mutationKey: checkoutKeys.createOrder }) > 0
  const [lastCart, setLastCart] = useState(cartQuery.data)
  if (cartQuery.data !== lastCart && !isPlacingOrder) {
    setLastCart(cartQuery.data)
  }
  const cart = isPlacingOrder ? lastCart : cartQuery.data

  if (walletsQuery.isPending || cartQuery.isPending || activeOrderQuery.isPending) {
    return <CheckoutSkeleton />
  }

  const failed = [walletsQuery, cartQuery, activeOrderQuery].find((query) => query.isError)
  if (failed) {
    return (
      <CatalogMessage
        tone="error"
        title="Não foi possível carregar o pagamento"
        description={getErrorMessage(failed.error)}
        action={<Button onClick={() => void failed.refetch()}>Tentar novamente</Button>}
      />
    )
  }

  const pendingOrder = activeOrderQuery.data?.order
  if (pendingOrder && !isPlacingOrder) {
    return (
      <CatalogMessage
        title="Você tem uma compra em processamento"
        description="Aguarde a confirmação na rede antes de iniciar outro pagamento."
        action={
          <Button asChild>
            <Link to="/pedidos/$orderId" params={{ orderId: pendingOrder.id }}>
              Acompanhar pedido
            </Link>
          </Button>
        }
      />
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <CatalogMessage
        title="Seu carrinho está vazio"
        description="Adicione NFTs ao carrinho para seguir para o pagamento."
        action={
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar NFTs
            </Link>
          </Button>
        }
      />
    )
  }

  const wallets = walletsQuery.data?.items ?? []
  if (wallets.length === 0) {
    return (
      <CatalogMessage
        title="Cadastre uma carteira"
        description="Você precisa de uma carteira salva no perfil para concluir a compra."
        action={
          <Button asChild>
            <Link to="/perfil/carteiras" search={{ retorno: 'pagamento' }}>
              Cadastrar carteira
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <CheckoutForm user={user} wallets={wallets} cart={cart} owner={owner} couponCode={couponCode} />
  )
}

export function CheckoutPage() {
  const { cupom } = routeApi.useSearch()
  const { user } = useSession()

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-3">
        <MarketBreadcrumb current="Pagamento" />
        <MobilePageHeader title="Pagamento com carteira" />
      </div>
      {user ? (
        <CheckoutContent key={user.id} user={user} couponCode={cupom ?? null} />
      ) : (
        <CheckoutSkeleton />
      )}
    </div>
  )
}
