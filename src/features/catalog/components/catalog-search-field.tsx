import { Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { MAX_SEARCH_LENGTH } from '@/shared/api/contracts/catalog'
import { Input } from '@/shared/ui/input'

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
      className="relative"
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
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-secondary"
      />
      <Input
        id={inputId}
        type="search"
        value={draft}
        maxLength={MAX_SEARCH_LENGTH}
        placeholder="Explorar coleções"
        autoComplete="off"
        className="pl-11"
        onChange={(event) => {
          setDraft(event.target.value)
        }}
      />
    </form>
  )
}
