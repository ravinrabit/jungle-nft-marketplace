import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import type { Quote } from '@/shared/api/contracts/commerce'
import { getErrorMessage, hasErrorCode, isApiError } from '@/shared/api/api-error'
import { notifyUnavailableFeature } from '@/shared/lib/unavailable-feature'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { CatalogMessage } from '@/features/catalog/components/nft-grid'
import { RelatedNfts } from '@/features/nft-detail/components/related-nfts'
import { quoteQueryOptions, useCart } from '../api/cart-queries'
import { CartItemCard, CartTableRow } from './cart-lines'
import { DesktopCartSummary, MobileCartSummary, type CheckoutControls } from './cart-summary'

const routeApi = getRouteApi('/carrinho')

const BLOCKING_ISSUES = new Set(['UNAVAILABLE', 'AVAILABILITY_REDUCED'])

function checkoutBlockReason(quote: Quote | undefined) {
  if (!quote) {
    return 'Aguardando a cotação atualizada.'
  }
  return quote.issues.some((issue) => BLOCKING_ISSUES.has(issue.type))
    ? 'Ajuste os itens sem disponibilidade antes de finalizar.'
    : null
}

function CartSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando carrinho"
      className="flex flex-col gap-5 lg:flex-row lg:justify-between"
    >
      <div className="flex flex-col gap-3 lg:w-[48.875rem]">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-[6.25rem] w-full rounded-[0.875rem] lg:h-[4.375rem] lg:rounded-none"
          />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:w-[20.75rem]">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-5 w-full" />
        ))}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function CartPage() {
  const { cupom } = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { owner, query: cartQuery } = useCart()
  const cart = cartQuery.data
  const hasItems = Boolean(cart && cart.items.length > 0)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const cartVersion = cart?.version ?? 0
  const urlCouponQuery = useQuery({
    ...quoteQueryOptions(owner, cartVersion, { couponCode: cupom ?? null, network: null }),
    enabled: hasItems && Boolean(cupom),
  })
  const isUrlCouponRejected = hasErrorCode(urlCouponQuery.error, 'COUPON_INVALID', 'COUPON_EXPIRED')
  const effectiveCoupon = cupom && !isUrlCouponRejected ? cupom : null

  const quoteQuery = useQuery({
    ...quoteQueryOptions(owner, cartVersion, { couponCode: effectiveCoupon, network: null }),
    enabled: hasItems,
    placeholderData: keepPreviousData,
  })

  const displayedCouponError =
    couponError ?? (isUrlCouponRejected ? getErrorMessage(urlCouponQuery.error) : null)

  const applyCoupon = (code: string) => {
    setIsApplyingCoupon(true)
    setCouponError(null)
    queryClient
      .query(quoteQueryOptions(owner, cartVersion, { couponCode: code, network: null }))
      .then(() => navigate({ search: { cupom: code }, replace: true, resetScroll: false }))
      .catch((error: unknown) => {
        setCouponError(
          isApiError(error) && error.fieldErrors.couponCode?.[0]
            ? error.message
            : getErrorMessage(error),
        )
      })
      .finally(() => {
        setIsApplyingCoupon(false)
      })
  }

  const removeCoupon = () => {
    setCouponError(null)
    void navigate({ search: { cupom: undefined }, replace: true, resetScroll: false })
  }

  const blockReason = checkoutBlockReason(quoteQuery.data)
  const checkout: CheckoutControls = {
    isBlocked: blockReason !== null || quoteQuery.isFetching,
    blockReason,
    onCheckout: () => {
      notifyUnavailableFeature('O pagamento')
    },
  }

  const summaryProps = {
    quote: quoteQuery.data,
    isQuotePending: quoteQuery.isPending,
    isQuoteRefreshing: quoteQuery.isFetching,
    coupon: {
      appliedCode: effectiveCoupon ?? undefined,
      error: displayedCouponError,
      isApplying: isApplyingCoupon,
      apply: applyCoupon,
      remove: removeCoupon,
    },
    checkout,
  }

  const priceChanges = cart?.items.filter((item) => item.priceChangedFrom) ?? []

  return (
    <div className="flex flex-col gap-12 lg:gap-24">
      <div className="flex flex-col gap-3">
        <nav aria-label="Trilha de navegação" className="hidden lg:block">
          <ol className="flex gap-1 text-[0.9375rem] leading-4 font-bold text-foreground">
            <li>
              <Link to="/" className="hover:text-text-accent">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/" hash="catalogo" className="hover:text-text-accent">
                Mercado
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Carrinho</li>
          </ol>
        </nav>

        <header className="relative flex h-11 items-center justify-center lg:h-auto lg:justify-start">
          <button
            type="button"
            aria-label="Voltar"
            className="absolute left-0 flex size-[2.1875rem] cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-text-secondary lg:hidden"
            onClick={() => {
              router.history.back()
            }}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <h1 className="text-xl leading-4 font-bold text-foreground lg:sr-only">
            Carrinho de NFTs
          </h1>
        </header>

        {priceChanges.length > 0 && (
          <p
            role="status"
            className="rounded-md border border-amber/50 bg-amber/10 px-4 py-3 text-sm text-foreground"
          >
            {priceChanges.length === 1
              ? `O preço de ${priceChanges[0]?.name ?? 'um item'} mudou desde que foi adicionado. O resumo já mostra o valor atual.`
              : `${priceChanges.length} itens mudaram de preço desde que foram adicionados. O resumo já mostra os valores atuais.`}
          </p>
        )}

        {cartQuery.isPending ? (
          <CartSkeleton />
        ) : cartQuery.isError ? (
          <CatalogMessage
            tone="error"
            title="Não foi possível carregar o carrinho"
            description={getErrorMessage(cartQuery.error)}
            action={<Button onClick={() => void cartQuery.refetch()}>Tentar novamente</Button>}
          />
        ) : !hasItems ? (
          <CatalogMessage
            title="Seu carrinho está vazio"
            description="Explore o catálogo e adicione NFTs para continuar."
            action={
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Explorar NFTs
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="hidden w-[48.875rem] flex-col gap-3 lg:flex">
              <div
                className="flex justify-between pr-6 text-base leading-4 text-foreground"
                aria-hidden="true"
              >
                <span className="w-[15.625rem] font-bold">NFTs</span>
                <span className="w-[4.8125rem] font-medium">Preço</span>
                <span className="w-[4.6875rem] font-bold">Edições</span>
                <span className="w-[5.4375rem] font-medium">Total</span>
                <span className="w-6" />
              </div>
              <div aria-hidden="true" className="h-px bg-primary/40" />
              <ul aria-label="Itens do carrinho" className="flex flex-col gap-3">
                {cart?.items.map((item) => (
                  <CartTableRow key={item.id} item={item} />
                ))}
              </ul>
            </div>

            <ul aria-label="Itens do carrinho" className="flex flex-col gap-5 lg:hidden">
              {cart?.items.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </ul>

            <DesktopCartSummary {...summaryProps} />
            <MobileCartSummary {...summaryProps} />
          </div>
        )}
      </div>

      {cart?.items[0] && (
        <div className="hidden lg:block">
          <RelatedNfts nftId={cart.items[0].nftId} title="Colecionadores também viram" />
        </div>
      )}
    </div>
  )
}
