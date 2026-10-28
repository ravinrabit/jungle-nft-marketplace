import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { quoteSchema, type Quote, type WalletConnection } from '@/shared/api/contracts/commerce'
import { getErrorMessage, hasErrorCode, isApiError } from '@/shared/api/api-error'
import { cartKeys, quoteQueryOptions, type CartOwnerKey } from '@/features/cart/api/cart-queries'
import { useConnectWallet, useCreateOrder, useDisconnectWallet } from './api/checkout-queries'
import {
  CHECKOUT_FIELDS,
  toCollectorDetails,
  type CheckoutFormValues,
  type CheckoutSubmission,
} from './checkout-form'
import { checkoutAttempt, checkoutDraft } from './checkout-storage'

const BLOCKING_ISSUES = new Set(['UNAVAILABLE', 'AVAILABILITY_REDUCED'])
const QUOTE_CONFLICT_CODES = ['PRICE_CHANGED', 'AVAILABILITY_CONFLICT', 'QUOTE_EXPIRED'] as const
const UNAVAILABLE_MESSAGE =
  'Um dos itens não está mais disponível na quantidade escolhida. Revise o carrinho antes de continuar.'

export interface CheckoutReview {
  quote: Quote
  connection: WalletConnection
  submission: CheckoutSubmission
  notice: string | null
}

type FieldErrorHandler = (field: keyof CheckoutFormValues, message: string) => void

interface CheckoutFlowOptions {
  userId: string
  owner: CartOwnerKey
  cartVersion: number
  couponCode: string | null
  onFieldError: FieldErrorHandler
}

function isPurchasable(quote: Quote) {
  return quote.lines.length > 0 && !quote.issues.some((issue) => BLOCKING_ISSUES.has(issue.type))
}

function sameTarget(connection: WalletConnection, submission: CheckoutSubmission) {
  return (
    connection.walletId === submission.walletId &&
    connection.provider === submission.provider &&
    connection.network === submission.network
  )
}

function readConflictQuote(error: unknown) {
  if (!isApiError(error)) {
    return null
  }
  const parsed = quoteSchema.safeParse(error.details.quote)
  return parsed.success ? parsed.data : null
}

function readPendingOrderId(error: unknown) {
  if (!isApiError(error) || error.code !== 'CONFLICT') {
    return null
  }
  const { orderId } = error.details
  return typeof orderId === 'string' ? orderId : null
}

function isCheckoutField(field: string): field is (typeof CHECKOUT_FIELDS)[number] {
  return (CHECKOUT_FIELDS as readonly string[]).includes(field)
}

function applyCollectorFieldErrors(error: unknown, onFieldError: FieldErrorHandler) {
  if (!isApiError(error)) {
    return false
  }
  let applied = false
  for (const [path, messages] of Object.entries(error.fieldErrors)) {
    const field = path.replace(/^collector\./, '')
    const message = messages[0]
    if (message && isCheckoutField(field)) {
      onFieldError(field, message)
      applied = true
    }
  }
  return applied
}

export function useCheckoutFlow({
  userId,
  owner,
  cartVersion,
  couponCode,
  onFieldError,
}: CheckoutFlowOptions) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const connectWallet = useConnectWallet()
  const disconnectWallet = useDisconnectWallet()
  const createOrder = useCreateOrder(userId)
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [review, setReview] = useState<CheckoutReview | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshCart = () => {
    void queryClient.invalidateQueries({ queryKey: cartKeys.cart(owner) })
    void queryClient.invalidateQueries({ queryKey: [...owner, 'quote'] })
  }

  const ensureConnection = async (submission: CheckoutSubmission) => {
    if (connection && sameTarget(connection, submission)) {
      return connection
    }
    const created = await connectWallet.mutateAsync({
      walletId: submission.walletId,
      provider: submission.provider,
      network: submission.network,
    })
    setConnection(created)
    return created
  }

  const prepare = async (submission: CheckoutSubmission) => {
    setError(null)
    setIsPreparing(true)
    try {
      const active = await ensureConnection(submission)
      const quote = await queryClient.query({
        ...quoteQueryOptions(owner, cartVersion, { couponCode, network: submission.network }),
        staleTime: 0,
      })
      if (!isPurchasable(quote)) {
        setError(UNAVAILABLE_MESSAGE)
        return
      }
      setReview({ quote, connection: active, submission, notice: null })
    } catch (caught) {
      const networkError = isApiError(caught) ? caught.fieldErrors.network?.[0] : undefined
      if (networkError) {
        onFieldError('network', networkError)
      }
      setError(getErrorMessage(caught))
    } finally {
      setIsPreparing(false)
    }
  }

  const handleOrderError = (caught: unknown, current: CheckoutReview) => {
    if (hasErrorCode(caught, ...QUOTE_CONFLICT_CODES)) {
      refreshCart()
      const fresh = readConflictQuote(caught)
      if (!fresh || !isPurchasable(fresh)) {
        setReview(null)
        setError(UNAVAILABLE_MESSAGE)
        return
      }
      setError(null)
      setReview({
        ...current,
        quote: fresh,
        notice: `${getErrorMessage(caught)} Confira os novos valores antes de assinar.`,
      })
      return
    }

    if (hasErrorCode(caught, 'WALLET_DISCONNECTED')) {
      setConnection(null)
      setReview(null)
      setError(getErrorMessage(caught))
      return
    }

    const pendingOrderId = readPendingOrderId(caught)
    if (pendingOrderId) {
      setReview(null)
      void navigate({ to: '/pedidos/$orderId', params: { orderId: pendingOrderId } })
      return
    }

    if (hasErrorCode(caught, 'IDEMPOTENCY_CONFLICT')) {
      checkoutAttempt.clear(userId)
    }

    if (
      hasErrorCode(caught, 'VALIDATION_ERROR') &&
      applyCollectorFieldErrors(caught, onFieldError)
    ) {
      setReview(null)
      setError(getErrorMessage(caught))
      return
    }

    setError(getErrorMessage(caught))
  }

  const confirm = () => {
    if (!review) {
      return
    }
    const payload = {
      quoteId: review.quote.id,
      connectionId: review.connection.id,
      collector: toCollectorDetails(review.submission),
    }
    setError(null)
    createOrder.mutate(
      { payload, idempotencyKey: checkoutAttempt.keyFor(userId, payload) },
      {
        onSuccess: (order) => {
          checkoutAttempt.clear(userId)
          checkoutDraft.clear(userId)
          setReview(null)
          void navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } })
        },
        onError: (caught) => {
          handleOrderError(caught, review)
        },
      },
    )
  }

  const cancelReview = () => {
    if (!createOrder.isPending) {
      setReview(null)
      setError(null)
    }
  }

  const disconnect = () => {
    if (!connection) {
      return
    }
    disconnectWallet.mutate(connection.id)
    setConnection(null)
    setReview(null)
  }

  return {
    connection,
    review,
    error,
    isPreparing,
    isSubmitting: createOrder.isPending,
    prepare,
    confirm,
    cancelReview,
    disconnect,
  }
}
