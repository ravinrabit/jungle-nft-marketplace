import type { ReactNode } from 'react'
import { DEFAULT_PAGE_SIZE, type NftSummary } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/shared/ui/skeleton'
import { NftCard } from './nft-card'

const GRID_CLASSES =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 max-md:[&>li:nth-child(even)]:translate-y-8 md:grid-cols-3 md:pb-0 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-[4.5rem] xl:grid-cols-3 xl:gap-x-[2.125rem]'
const PRIORITY_IMAGE_COUNT = 2

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

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 lg:gap-3">
      <Skeleton className="aspect-[175/200] w-full rounded-[1.25rem] lg:aspect-[258/300] lg:rounded-none" />
      <div className="flex flex-col gap-1.5 pl-2 lg:pl-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export function NftGridSkeleton({ count = DEFAULT_PAGE_SIZE }: { count?: number }) {
  return (
    <ul className={GRID_CLASSES} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <NftCardSkeleton />
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
      className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-[1.25rem] bg-surface-card px-6 py-12 text-center lg:rounded-none"
    >
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="max-w-md text-sm leading-6 text-text-secondary">{description}</p>
      {action}
    </div>
  )
}
