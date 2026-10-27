import type { ReactNode } from 'react'
import type { NftSummary } from '@/shared/api/contracts/catalog'
import { DEFAULT_PAGE_SIZE } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/shared/ui/skeleton'
import { NftCard } from './nft-card'

const GRID_CLASSES = 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10'
const PRIORITY_IMAGE_COUNT = 3

interface NftGridProps {
  items: readonly NftSummary[]
  isRefreshing: boolean
}

export function NftGrid({ items, isRefreshing }: NftGridProps) {
  return (
    <ul
      className={cn(GRID_CLASSES, 'transition-opacity', isRefreshing && 'opacity-60')}
      aria-busy={isRefreshing}
    >
      {items.map((nft, index) => (
        <li key={nft.id}>
          <NftCard nft={nft} priority={index < PRIORITY_IMAGE_COUNT} />
        </li>
      ))}
    </ul>
  )
}

export function NftGridSkeleton({ count = DEFAULT_PAGE_SIZE }: { count?: number }) {
  return (
    <ul className={GRID_CLASSES} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </li>
      ))}
    </ul>
  )
}

interface CatalogMessageProps {
  title: string
  description: string
  action?: ReactNode
  tone?: 'neutral' | 'error'
}

export function CatalogMessage({
  title,
  description,
  action,
  tone = 'neutral',
}: CatalogMessageProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="flex min-h-80 flex-col items-center justify-center gap-4 bg-surface-card px-6 py-12 text-center"
    >
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="max-w-md text-sm leading-6 text-text-secondary">{description}</p>
      {action}
    </div>
  )
}
