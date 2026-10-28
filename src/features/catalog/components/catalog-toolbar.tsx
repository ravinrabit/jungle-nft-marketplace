import { useId } from 'react'
import {
  CATALOG_SORTS,
  CATALOG_TABS,
  catalogSortSchema,
  type CatalogSort,
  type CatalogTab,
} from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SORT_LABELS, TAB_LABELS } from '../catalog-labels'

interface CatalogTabsProps {
  tab: CatalogTab
  onTabChange: (tab: CatalogTab) => void
  className?: string
}

export function CatalogTabs({ tab, onTabChange, className }: CatalogTabsProps) {
  return (
    <div
      role="group"
      aria-label="Tipo de listagem"
      className={cn('flex items-start gap-4 overflow-x-auto lg:gap-5', className)}
    >
      {CATALOG_TABS.map((option) => {
        const isActive = option === tab
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              onTabChange(option)
            }}
            className={cn(
              'flex shrink-0 cursor-pointer flex-col gap-1 text-sm leading-4 whitespace-nowrap transition-colors hover:text-text-accent lg:text-[0.9375rem] lg:font-medium',
              isActive ? 'font-bold text-text-accent' : 'font-normal text-foreground',
            )}
          >
            {TAB_LABELS[option]}
            <span
              aria-hidden="true"
              className={cn('h-0.5 w-full', isActive ? 'bg-primary' : 'bg-transparent')}
            />
          </button>
        )
      })}
    </div>
  )
}

interface CatalogSortSelectProps {
  sort: CatalogSort
  onSortChange: (sort: CatalogSort) => void
  className?: string
}

export function CatalogSortSelect({ sort, onSortChange, className }: CatalogSortSelectProps) {
  const sortId = useId()

  return (
    <div className={cn('flex items-center gap-1 text-[0.9375rem] leading-none', className)}>
      <label htmlFor={sortId} className="whitespace-nowrap text-foreground">
        Ordenar por:
      </label>
      <Select
        value={sort}
        onValueChange={(value) => {
          const parsed = catalogSortSchema.safeParse(value)
          if (parsed.success) {
            onSortChange(parsed.data)
          }
        }}
      >
        <SelectTrigger
          id={sortId}
          className="h-auto cursor-pointer gap-2 border-0 bg-transparent p-0 text-[0.9375rem] text-foreground shadow-none hover:text-text-accent focus-visible:ring-2 focus-visible:ring-ring dark:bg-transparent"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-border bg-surface-card">
          {CATALOG_SORTS.map((option) => (
            <SelectItem key={option} value={option}>
              {SORT_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
