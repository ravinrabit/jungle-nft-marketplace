import { useId, useState } from 'react'
import {
  CATEGORY_IDS,
  NETWORK_IDS,
  type CatalogFacets,
  type CategoryId,
  type NetworkId,
} from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Slider } from '@/shared/ui/slider'
import { CATEGORY_LABELS, NETWORK_LABELS } from '../catalog-labels'
import type { CatalogSearch } from '../catalog-search'

type FilterChange = Partial<
  Pick<CatalogSearch, 'categories' | 'networks' | 'minPrice' | 'maxPrice'>
>

interface CatalogFiltersProps {
  search: CatalogSearch
  facets: CatalogFacets | undefined
  onChange: (change: FilterChange) => void
  className?: string
}

const FALLBACK_PRICE_RANGE = { min: '0.02', max: '12.30' }
const PRICE_STEP = 0.01

function toggleValue<TValue extends string>(values: readonly TValue[] | undefined, value: TValue) {
  const current = values ?? []
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
  return next.length > 0 ? [...next].sort() : undefined
}

function facetCount<TId extends string>(
  entries: readonly { id: TId; count: number }[] | undefined,
  id: TId,
) {
  return entries?.find((entry) => entry.id === id)?.count
}

interface FilterListProps<TId extends string> {
  legend: string
  ids: readonly TId[]
  labels: Record<TId, string>
  selected: readonly TId[] | undefined
  counts: readonly { id: TId; count: number }[] | undefined
  boldCounts: boolean
  listClassName: string
  onToggle: (id: TId) => void
}

function FilterList<TId extends string>({
  legend,
  ids,
  labels,
  selected,
  counts,
  boldCounts,
  listClassName,
  onToggle,
}: FilterListProps<TId>) {
  const groupId = useId()

  return (
    <fieldset className="flex flex-col">
      <legend className="mb-3 text-lg leading-4 font-bold text-foreground">{legend}</legend>
      <div className={listClassName}>
        {ids.map((id) => {
          const inputId = `${groupId}-${id}`
          const isChecked = selected?.includes(id) ?? false
          const count = facetCount(counts, id)

          return (
            <div key={id} className="relative">
              <input
                id={inputId}
                type="checkbox"
                checked={isChecked}
                className="peer sr-only"
                onChange={() => {
                  onToggle(id)
                }}
              />
              <label
                htmlFor={inputId}
                className={cn(
                  'flex h-10 cursor-pointer items-center justify-between text-[0.9375rem] leading-10 transition-colors hover:text-text-accent',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                  isChecked ? 'font-bold text-text-accent' : 'text-text-secondary',
                )}
              >
                <span>{labels[id]}</span>
                {count !== undefined && (
                  <span className={boldCounts ? 'font-bold' : 'font-normal'}>
                    <span aria-hidden="true">({count})</span>
                    <span className="sr-only">{`, ${count} itens`}</span>
                  </span>
                )}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

function toSliderNumber(value: string) {
  return Number(value)
}

function toEthString(value: number) {
  return value.toFixed(2)
}

function formatBrazilianDecimal(value: number) {
  return value.toFixed(2).replace('.', ',')
}

interface PriceRangeFilterProps {
  minPrice: string | undefined
  maxPrice: string | undefined
  bounds: { min: string; max: string }
  onApply: (change: Pick<FilterChange, 'minPrice' | 'maxPrice'>) => void
}

function PriceRangeFilter({ minPrice, maxPrice, bounds, onApply }: PriceRangeFilterProps) {
  const titleId = useId()
  const lowerBound = toSliderNumber(bounds.min)
  const upperBound = toSliderNumber(bounds.max)
  const [draft, setDraft] = useState<[number, number]>([
    toSliderNumber(minPrice ?? bounds.min),
    toSliderNumber(maxPrice ?? bounds.max),
  ])
  const [draftMin, draftMax] = draft

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h3 id={titleId} className="text-lg leading-4 font-bold text-foreground">
        Faixa de preço
      </h3>
      <div className="flex flex-col gap-3 pl-3">
        <Slider
          min={Math.min(lowerBound, draftMin)}
          max={Math.max(upperBound, draftMax)}
          step={PRICE_STEP}
          minStepsBetweenThumbs={1}
          value={draft}
          thumbLabels={['Preço mínimo', 'Preço máximo']}
          onValueChange={(values) => {
            const [nextMin = lowerBound, nextMax = upperBound] = values
            setDraft([nextMin, nextMax])
          }}
        />
        <p className="text-[0.9375rem] leading-none text-foreground" aria-live="polite">
          Preço: {formatBrazilianDecimal(draftMin)} - {formatBrazilianDecimal(draftMax)} ETH
        </p>
        <Button
          type="button"
          className="h-9 w-[5.75rem] rounded-md px-3 py-2 text-base leading-5 font-bold"
          onClick={() => {
            const isFullRange = draftMin <= lowerBound && draftMax >= upperBound
            onApply(
              isFullRange
                ? { minPrice: undefined, maxPrice: undefined }
                : { minPrice: toEthString(draftMin), maxPrice: toEthString(draftMax) },
            )
          }}
        >
          Aplicar
        </Button>
      </div>
    </section>
  )
}

export function CatalogFilters({ search, facets, onChange, className }: CatalogFiltersProps) {
  const bounds = facets?.priceRange ?? FALLBACK_PRICE_RANGE

  return (
    <div className={cn('flex flex-col gap-10 bg-surface-card p-5', className)}>
      <FilterList<CategoryId>
        legend="Coleções"
        ids={CATEGORY_IDS}
        labels={CATEGORY_LABELS}
        selected={search.categories}
        counts={facets?.categories}
        boldCounts
        listClassName="px-3"
        onToggle={(id) => {
          onChange({ categories: toggleValue(search.categories, id) })
        }}
      />
      <PriceRangeFilter
        key={`${search.minPrice ?? bounds.min}-${search.maxPrice ?? bounds.max}`}
        minPrice={search.minPrice}
        maxPrice={search.maxPrice}
        bounds={bounds}
        onApply={onChange}
      />
      <FilterList<NetworkId>
        legend="Rede"
        ids={NETWORK_IDS}
        labels={NETWORK_LABELS}
        selected={search.networks}
        counts={facets?.networks}
        boldCounts={false}
        listClassName="pl-3"
        onToggle={(id) => {
          onChange({ networks: toggleValue(search.networks, id) })
        }}
      />
    </div>
  )
}
