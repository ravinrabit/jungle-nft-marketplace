import { createFileRoute } from '@tanstack/react-router'
import { couponSearchSchema } from '@/features/cart/coupon-search'
import { CartPage } from '@/features/cart/components/cart-page'

export const Route = createFileRoute('/carrinho')({
  validateSearch: couponSearchSchema,
  component: CartPage,
})
