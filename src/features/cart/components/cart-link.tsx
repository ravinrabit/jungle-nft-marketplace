import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useCart } from '../api/cart-queries'

const MAX_BADGE_COUNT = 99

function describeCount(count: number) {
  if (count === 0) {
    return 'Carrinho vazio'
  }
  return count === 1 ? 'Carrinho com 1 item' : `Carrinho com ${count} itens`
}

interface CartLinkProps {
  className: string
  iconClassName: string
}

export function CartLink({ className, iconClassName }: CartLinkProps) {
  const { query } = useCart()
  const count = query.data?.itemCount ?? 0

  return (
    <Link to="/carrinho" aria-label={describeCount(count)} className={cn('relative', className)}>
      <ShoppingCart aria-hidden="true" className={iconClassName} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-ink bg-primary px-0.5 text-[0.625rem] leading-none font-medium text-ink"
        >
          {Math.min(count, MAX_BADGE_COUNT)}
        </span>
      )}
    </Link>
  )
}
