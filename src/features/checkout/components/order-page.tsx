import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { CircleCheckBig, CircleX, Loader2 } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import type { Order, OrderStatus } from '@/shared/api/contracts/commerce'
import { getErrorMessage, hasErrorCode } from '@/shared/api/api-error'
import { shortenAddress } from '@/shared/lib/address'
import { formatEth } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'
import { WALLET_PROVIDER_LABELS } from '@/features/account/wallet-form-values'
import { useSession } from '@/features/auth/api/auth-queries'
import { privateQueryKey } from '@/features/auth/session-lifecycle'
import { catalogKeys } from '@/features/catalog/api/catalog-queries'
import { CatalogMessage } from '@/features/catalog/components/nft-grid'
import { NETWORK_LABELS } from '@/features/catalog/catalog-labels'
import { cartKeys } from '@/features/cart/api/cart-queries'
import { checkoutKeys, orderQueryOptions } from '../api/checkout-queries'
import { OrderLineItem } from './order-totals'

const routeApi = getRouteApi('/pedidos/$orderId')

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const EXPLORER_NAMES = { ethereum: 'Etherscan', polygon: 'Polygonscan', solana: 'Solscan' } as const

function formatOrderDate(iso: string) {
  const date = new Date(iso)
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()] ?? ''}, ${date.getFullYear()}`
}

function useSettlementSync(userId: string, status: OrderStatus | undefined) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (status === undefined || status === 'pending') {
      return
    }
    void queryClient.invalidateQueries({ queryKey: checkoutKeys.activeOrder(userId) })
    if (status === 'confirmed') {
      void queryClient.invalidateQueries({ queryKey: cartKeys.cart(privateQueryKey(userId)) })
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
    }
  }, [queryClient, status, userId])
}

interface OrderShellProps {
  title: string
  icon: ReactNode
  description?: string
  children: ReactNode
}

function OrderShell({ title, icon, description, children }: OrderShellProps) {
  const navigate = useNavigate()
  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          void navigate({ to: '/' })
        }
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] gap-0 overflow-y-auto rounded-none border-0 bg-surface-card p-0 text-foreground sm:max-w-[36.125rem] [&>[data-slot=dialog-close]]:top-5 [&>[data-slot=dialog-close]]:right-5 [&>[data-slot=dialog-close]_svg]:size-[1.125rem]"
        overlayClassName="bg-ink"
      >
        <header className="flex min-h-[9.75rem] flex-col items-center justify-center gap-3 px-9 py-6 text-center">
          {icon}
          <DialogTitle className="text-base leading-5 font-bold text-text-secondary">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm leading-[1.375rem] text-text-secondary">
              {description}
            </DialogDescription>
          )}
        </header>
        {children}
        <div aria-hidden="true" className="h-2.5 bg-primary" />
      </DialogContent>
    </Dialog>
  )
}

function ReceiptMeta({ order }: { order: Order }) {
  const items = [
    {
      label: 'ID da transação',
      value: order.transactionHash ? shortenAddress(order.transactionHash) : 'Aguardando',
    },
    { label: 'Data', value: formatOrderDate(order.createdAt) },
    { label: 'Total', value: formatEth(order.total) },
    { label: 'Carteira', value: WALLET_PROVIDER_LABELS[order.wallet.provider] },
  ]
  return (
    <dl className="grid grid-cols-2 border-y border-primary px-4 py-1 sm:grid-cols-4 sm:px-9">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1.5 px-2 py-3 sm:border-l sm:border-primary sm:first:border-l-0 sm:first:pl-0"
        >
          <dt className="text-sm leading-4 font-bold text-foreground">{item.label}</dt>
          <dd className="text-[0.9375rem] leading-4 whitespace-nowrap text-text-secondary">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ConfirmedReceipt({ order }: { order: Order }) {
  const network = NETWORK_LABELS[order.wallet.network]
  return (
    <OrderShell
      title="Seus NFTs agora estão na sua carteira"
      icon={<CircleCheckBig aria-hidden="true" className="size-20 text-primary" />}
    >
      <ReceiptMeta order={order} />
      <section
        aria-labelledby="detalhes-transacao"
        className="flex flex-col gap-5 px-5 pt-5 pb-12 sm:px-11"
      >
        <h3 id="detalhes-transacao" className="text-[0.9375rem] leading-4 font-bold">
          Detalhes da transação
        </h3>
        <div
          aria-hidden="true"
          className="flex items-center gap-3 pr-4 text-sm leading-4 font-bold text-foreground"
        >
          <span className="flex-1">NFTs</span>
          <span className="hidden w-16 text-center sm:block">Edições</span>
          <span>Subtotal</span>
        </div>
        <ul aria-label="NFTs comprados" className="flex flex-col gap-3">
          {order.lines.map((line) => (
            <OrderLineItem key={line.cartItemId} line={line} showEditionColumn />
          ))}
        </ul>
        <dl className="flex flex-col gap-3 text-[0.9375rem] leading-4">
          <div className="flex items-center justify-between">
            <dt>Taxa de rede</dt>
            <dd>{formatEth(order.networkFee)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-bold">Total</dt>
            <dd className="text-lg font-bold text-text-accent">{formatEth(order.total)}</dd>
          </div>
        </dl>
        <div aria-hidden="true" className="h-px bg-primary/40" />
        <p className="text-center text-sm leading-[1.375rem] text-text-secondary">
          Transação confirmada na {network}. A propriedade foi transferida para a carteira{' '}
          {order.wallet.label} ({shortenAddress(order.wallet.address)}).
        </p>
        {order.explorerUrl && (
          <a
            href={order.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 min-w-[11.625rem] items-center justify-center self-center rounded-[0.3125rem] bg-primary px-6 text-base leading-4 font-bold text-ink hover:bg-primary-light"
          >
            Ver no {EXPLORER_NAMES[order.wallet.network]}
            <span className="sr-only"> (abre em uma nova aba)</span>
          </a>
        )}
      </section>
    </OrderShell>
  )
}

function PendingOrder({ order }: { order: Order }) {
  return (
    <OrderShell
      title="Confirmando sua compra na rede"
      description="Isso leva alguns segundos. Você pode sair desta página: o pedido continua sendo processado."
      icon={<Loader2 aria-hidden="true" className="size-20 animate-spin text-primary" />}
    >
      <p role="status" className="sr-only">
        Pedido aguardando confirmação.
      </p>
      <ReceiptMeta order={order} />
      <div className="flex flex-col gap-3 px-5 pt-5 pb-12 sm:px-11">
        <ul aria-label="NFTs do pedido" className="flex flex-col gap-3">
          {order.lines.map((line) => (
            <OrderLineItem key={line.cartItemId} line={line} />
          ))}
        </ul>
      </div>
    </OrderShell>
  )
}

function DeclinedOrder({ order }: { order: Order }) {
  return (
    <OrderShell
      title="O pagamento não foi concluído"
      description={order.declineReason ?? 'A transação não foi confirmada.'}
      icon={<CircleX aria-hidden="true" className="size-20 text-text-coral" />}
    >
      <p role="alert" className="sr-only">
        Pagamento recusado. {order.declineReason}
      </p>
      <div className="flex flex-col items-center gap-3 border-t border-primary px-5 pt-6 pb-12 text-center sm:px-11">
        <p className="text-sm leading-[1.375rem] text-text-secondary">
          Nenhum valor foi cobrado e os itens continuam no seu carrinho.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/pagamento">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        </div>
      </div>
    </OrderShell>
  )
}

function OrderView({ userId, orderId }: { userId: string; orderId: string }) {
  const orderQuery = useQuery(orderQueryOptions(userId, orderId))
  const order = orderQuery.data
  useSettlementSync(userId, order?.status)

  if (orderQuery.isPending) {
    return (
      <CatalogMessage title="Carregando pedido" description="Buscando o status da sua compra." />
    )
  }

  if (!order) {
    const isMissing = hasErrorCode(orderQuery.error, 'NOT_FOUND')
    return (
      <CatalogMessage
        tone="error"
        title={isMissing ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}
        description={getErrorMessage(orderQuery.error)}
        action={
          isMissing ? (
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          ) : (
            <Button onClick={() => void orderQuery.refetch()}>Tentar novamente</Button>
          )
        }
      />
    )
  }

  switch (order.status) {
    case 'pending':
      return <PendingOrder order={order} />
    case 'declined':
      return <DeclinedOrder order={order} />
    case 'confirmed':
      return <ConfirmedReceipt order={order} />
  }
}

export function OrderPage() {
  const { orderId } = routeApi.useParams()
  const { user } = useSession()
  return (
    <>
      <h1 className="sr-only">Pedido</h1>
      {user && <OrderView key={user.id} userId={user.id} orderId={orderId} />}
    </>
  )
}
