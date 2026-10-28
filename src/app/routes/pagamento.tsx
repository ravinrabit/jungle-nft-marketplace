import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/require-session'
import { couponSearchSchema } from '@/features/cart/coupon-search'
import { CheckoutPage } from '@/features/checkout/components/checkout-page'

export const Route = createFileRoute('/pagamento')({
  validateSearch: couponSearchSchema,
  beforeLoad: requireSession,
  component: CheckoutPage,
})
