import { useId } from 'react'
import {
  CATALOG_SORTS,
  CATALOG_TABS,
  catalogSortSchema,
  type CatalogSort,
  type CatalogTab,
} from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SORT_LABELS, TAB_LABELS } from '../catalog-labels'

interface CatalogToolbarProps {
  tab: CatalogTab
  sort: CatalogSort
  onTabChange: (tab: CatalogTab) => void
  onSortChange: (sort: CatalogSort) => void
}

export function CatalogToolbar({ tab, sort, onTabChange, onSortChange }: CatalogToolbarProps) {
  const sortId = useId()

  return (
    <div className="flex flex-col gap-4 border-b border-border-soft pb-4 md:flex-row md:items-center md:justify-between">
      <div role="group" aria-label="Tipo de listagem" className="flex gap-6 overflow-x-auto">
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
                'shrink-0 cursor-pointer border-b-2 pb-1 text-[0.9375rem] font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'border-text-accent text-text-accent'
                  : 'border-transparent text-foreground hover:text-text-accent',
              )}
            >
              {TAB_LABELS[option]}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={sortId} className="text-sm font-normal whitespace-nowrap">
          Ordenar por:
        </Label>
        <Select
          value={sort}
          onValueChange={(value) => {
            const parsed = catalogSortSchema.safeParse(value)
            if (parsed.success) {
              onSortChange(parsed.data)
            }
          }}
        >
          <SelectTrigger id={sortId} className="min-w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATALOG_SORTS.map((option) => (
              <SelectItem key={option} value={option}>
                {SORT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
