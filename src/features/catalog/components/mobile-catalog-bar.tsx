import { SlidersHorizontal } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'
import { useCatalogSearch } from '../use-catalog-search'
import { CatalogFilters } from './catalog-filters'
import { CatalogSearchField } from './catalog-search-field'
import { CatalogSortSelect } from './catalog-toolbar'

export function MobileCatalogBar() {
  const { search, query, updateSearch } = useCatalogSearch()
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleSearch = useCallback(
    (q: string | undefined) => {
      updateSearch({ q }, { replace: true })
    },
    [updateSearch],
  )

  return (
    <div className="flex gap-2 lg:hidden">
      <CatalogSearchField value={search.q} onSearch={handleSearch} />
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Abrir filtros"
            className="flex size-[2.8125rem] shrink-0 cursor-pointer items-center justify-center rounded-[0.875rem] bg-linear-to-br from-primary-light to-primary text-ink"
          >
            <SlidersHorizontal aria-hidden="true" className="size-[1.375rem]" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-[1.75rem] border-border bg-surface-card"
        >
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription className="text-text-secondary">
              Combine coleções, faixa de preço e rede. Os resultados atualizam na hora.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4 pb-8">
            <CatalogSortSelect
              sort={search.sort ?? 'recent'}
              onSortChange={(sort) => {
                updateSearch({ sort: sort === 'recent' ? undefined : sort })
              }}
            />
            <CatalogFilters
              search={search}
              facets={query.data?.facets}
              className="p-0"
              onChange={(change) => {
                updateSearch(change)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
