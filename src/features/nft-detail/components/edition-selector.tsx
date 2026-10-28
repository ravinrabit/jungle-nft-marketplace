import { useId } from 'react'
import type { Edition, EditionKind } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import { EDITION_LABELS } from '@/features/catalog/catalog-labels'

const CHIP_WIDTHS: Record<EditionKind, string> = {
  '1-1': 'min-w-9',
  '1-10': 'min-w-[2.625rem]',
  '1-50': 'min-w-[2.875rem]',
  open: 'min-w-[4.125rem]',
}

interface EditionSelectorProps {
  editions: readonly Edition[]
  selected: EditionKind
  onSelect: (kind: EditionKind) => void
}

function describeAvailability(edition: Edition) {
  if (edition.available === 0) {
    return 'esgotada'
  }
  return edition.supply === null
    ? 'edição aberta disponível'
    : `${edition.available} de ${edition.supply} disponíveis`
}

export function EditionSelector({ editions, selected, onSelect }: EditionSelectorProps) {
  const groupName = useId()

  return (
    <fieldset className="flex flex-col gap-2 lg:gap-3">
      <legend className="mb-2 text-[0.9375rem] leading-4 font-bold text-foreground lg:mb-3">
        Edição:
      </legend>
      <div className="flex flex-wrap gap-3 lg:gap-1.5">
        {editions.map((edition) => {
          const inputId = `${groupName}-${edition.kind}`
          const isSelected = edition.kind === selected
          const isSoldOut = edition.available === 0

          return (
            <div key={edition.kind}>
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={edition.kind}
                checked={isSelected}
                className="peer sr-only"
                onChange={() => {
                  onSelect(edition.kind)
                }}
              />
              <label
                htmlFor={inputId}
                title={describeAvailability(edition)}
                className={cn(
                  'flex h-7 cursor-pointer items-center justify-center rounded-full border px-1 text-sm leading-4 uppercase transition-colors',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                  CHIP_WIDTHS[edition.kind],
                  edition.kind === 'open' && 'px-2',
                  isSelected
                    ? 'border-primary font-medium text-text-accent'
                    : 'border-border font-normal text-text-secondary hover:border-primary',
                  isSoldOut && 'line-through decoration-1',
                )}
              >
                {EDITION_LABELS[edition.kind]}
                <span className="sr-only">{`, ${describeAvailability(edition)}`}</span>
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
