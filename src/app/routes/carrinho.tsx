import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { CartPage } from '@/features/cart/components/cart-page'

const cartSearchSchema = z.object({
  cupom: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,32}$/)
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/carrinho')({
  validateSearch: cartSearchSchema,
  component: CartPage,
})
