import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/require-session'
import { OrderPage } from '@/features/checkout/components/order-page'

export const Route = createFileRoute('/pedidos/$orderId')({
  beforeLoad: requireSession,
  component: OrderPage,
})
