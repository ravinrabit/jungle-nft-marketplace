import { cn } from '@/shared/lib/cn'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-sm bg-[linear-gradient(90deg,var(--kurio-surface-card)_0%,var(--kurio-surface-raised)_50%,var(--kurio-surface-card)_100%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
