import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex h-4 shrink-0 items-center rounded-full border border-border-soft px-1.5 text-[0.5625rem] leading-none font-bold tracking-wide text-price-muted uppercase',
        className,
      )}
    >
      <span className="sr-only">, </span>
      Em breve
    </span>
  )
}

interface ComingSoonItemProps {
  children: ReactNode
  className?: string
  showBadge?: boolean
}

export function ComingSoonItem({ children, className, showBadge = true }: ComingSoonItemProps) {
  return (
    <span
      aria-disabled="true"
      title="Em breve"
      className={cn(
        'relative inline-flex cursor-not-allowed items-center gap-2 opacity-60',
        className,
      )}
    >
      {children}
      {showBadge ? <ComingSoonBadge /> : <span className="sr-only">, em breve</span>}
    </span>
  )
}
