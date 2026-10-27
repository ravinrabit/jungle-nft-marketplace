import { useId, useState, type SubmitEvent } from 'react'
import {
  CATEGORY_IDS,
  NETWORK_IDS,
  type CatalogFacets,
  type CategoryId,
  type NetworkId,
} from '@/shared/api/contracts/catalog'
import { compareEth, isEthAmount } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { byLabel, CATEGORY_LABELS, NETWORK_LABELS } from '../catalog-labels'
import type { CatalogSearch } from '../catalog-search'

type FilterChange = Partial<
  Pick<CatalogSearch, 'categories' | 'networks' | 'minPrice' | 'maxPrice'>
>

interface CatalogFiltersProps {
  search: CatalogSearch
  facets: CatalogFacets | undefined
  onChange: (change: FilterChange) => void
}

function toggleValue<TValue extends string>(values: readonly TValue[] | undefined, value: TValue) {
  const current = values ?? []
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
  return next.length > 0 ? next.sort() : undefined
}

function facetCount<TId extends string>(
  entries: readonly { id: TId; count: number }[] | undefined,
  id: TId,
) {
  return entries?.find((entry) => entry.id === id)?.count
}

interface CheckboxGroupProps<TId extends string> {
  legend: string
  ids: readonly TId[]
  labels: Record<TId, string>
  selected: readonly TId[] | undefined
  counts: readonly { id: TId; count: number }[] | undefined
  onToggle: (id: TId) => void
}

function CheckboxGroup<TId extends string>({
  legend,
  ids,
  labels,
  selected,
  counts,
  onToggle,
}: CheckboxGroupProps<TId>) {
  const groupId = useId()

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-3 text-lg leading-4 font-bold">{legend}</legend>
      {[...ids].sort(byLabel(labels)).map((id) => {
        const inputId = `${groupId}-${id}`
        const isChecked = selected?.includes(id) ?? false
        const count = facetCount(counts, id)

        return (
          <div key={id} className="flex min-h-10 items-center gap-3">
            <Checkbox
              id={inputId}
              checked={isChecked}
              onCheckedChange={() => {
                onToggle(id)
              }}
            />
            <Label
              htmlFor={inputId}
              className={
                isChecked
                  ? 'flex flex-1 cursor-pointer justify-between text-[0.9375rem] font-normal text-text-accent'
                  : 'flex flex-1 cursor-pointer justify-between text-[0.9375rem] font-normal text-text-secondary'
              }
            >
              <span>{labels[id]}</span>
              {count !== undefined && <span aria-label={`${count} itens`}>({count})</span>}
            </Label>
          </div>
        )
      })}
    </fieldset>
  )
}

function normalizePriceInput(value: string) {
  return value.trim().replace(',', '.')
}

function validatePriceRange(minPrice: string, maxPrice: string) {
  if ((minPrice && !isEthAmount(minPrice)) || (maxPrice && !isEthAmount(maxPrice))) {
    return 'Use números com ponto decimal, por exemplo 0.5'
  }
  if (minPrice && maxPrice && compareEth(minPrice, maxPrice) > 0) {
    return 'O preço mínimo não pode ser maior que o máximo'
  }
  return null
}

interface PriceRangeFormProps {
  minPrice: string | undefined
  maxPrice: string | undefined
  placeholderRange: CatalogFacets['priceRange'] | undefined
  onApply: (change: Pick<FilterChange, 'minPrice' | 'maxPrice'>) => void
}

function PriceRangeForm({ minPrice, maxPrice, placeholderRange, onApply }: PriceRangeFormProps) {
  const formId = useId()
  const errorId = `${formId}-error`
  const [draftMin, setDraftMin] = useState(minPrice ?? '')
  const [draftMax, setDraftMax] = useState(maxPrice ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextMin = normalizePriceInput(draftMin)
    const nextMax = normalizePriceInput(draftMax)
    const validationError = validatePriceRange(nextMin, nextMax)
    setError(validationError)

    if (!validationError) {
      onApply({ minPrice: nextMin || undefined, maxPrice: nextMax || undefined })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby={`${formId}-title`}>
      <h3 id={`${formId}-title`} className="mb-4 text-lg leading-4 font-bold">
        Faixa de preço
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-min`} className="text-xs text-text-secondary">
            Mínimo (ETH)
          </Label>
          <Input
            id={`${formId}-min`}
            inputMode="decimal"
            autoComplete="off"
            value={draftMin}
            placeholder={placeholderRange?.min ?? '0.00'}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setDraftMin(event.target.value)
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${formId}-max`} className="text-xs text-text-secondary">
            Máximo (ETH)
          </Label>
          <Input
            id={`${formId}-max`}
            inputMode="decimal"
            autoComplete="off"
            value={draftMax}
            placeholder={placeholderRange?.max ?? '0.00'}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setDraftMax(event.target.value)
            }}
          />
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-text-coral">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" className="mt-4 font-bold">
        Aplicar
      </Button>
    </form>
  )
}

export function CatalogFilters({ search, facets, onChange }: CatalogFiltersProps) {
  return (
    <div className="flex flex-col gap-8 bg-surface-card p-5">
      <CheckboxGroup<CategoryId>
        legend="Coleções"
        ids={CATEGORY_IDS}
        labels={CATEGORY_LABELS}
        selected={search.categories}
        counts={facets?.categories}
        onToggle={(id) => {
          onChange({ categories: toggleValue(search.categories, id) })
        }}
      />
      <PriceRangeForm
        key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}`}
        minPrice={search.minPrice}
        maxPrice={search.maxPrice}
        placeholderRange={facets?.priceRange}
        onApply={onChange}
      />
      <CheckboxGroup<NetworkId>
        legend="Rede"
        ids={NETWORK_IDS}
        labels={NETWORK_LABELS}
        selected={search.networks}
        counts={facets?.networks}
        onToggle={(id) => {
          onChange({ networks: toggleValue(search.networks, id) })
        }}
      />
    </div>
  )
}
