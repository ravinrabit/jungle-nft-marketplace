import { Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { MAX_SEARCH_LENGTH } from '@/shared/api/contracts/catalog'

const SEARCH_DEBOUNCE_MS = 350

interface CatalogSearchFieldProps {
  value: string | undefined
  onSearch: (value: string | undefined) => void
}

export function CatalogSearchField({ value, onSearch }: CatalogSearchFieldProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(value ?? '')
  const [syncedValue, setSyncedValue] = useState(value)

  if (value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value ?? '')
  }

  useEffect(() => {
    const normalized = draft.trim() || undefined
    if (normalized === value) {
      return
    }

    const timeout = window.setTimeout(() => {
      onSearch(normalized)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [draft, value, onSearch])

  return (
    <form
      role="search"
      className="relative min-w-0 flex-1"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(draft.trim() || undefined)
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Buscar NFTs por nome, coleção ou criador
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-[1.375rem] -translate-y-1/2 text-price-muted"
      />
      <input
        id={inputId}
        type="search"
        value={draft}
        maxLength={MAX_SEARCH_LENGTH}
        placeholder="Explorar coleções"
        autoComplete="off"
        className="h-[2.8125rem] w-full rounded-[0.625rem] border border-transparent bg-surface-card pr-3 pl-[2.625rem] text-sm leading-4 font-bold text-foreground outline-none placeholder:text-price-muted focus-visible:border-primary"
        onChange={(event) => {
          setDraft(event.target.value)
        }}
      />
    </form>
  )
}
