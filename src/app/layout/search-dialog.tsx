import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { MAX_SEARCH_LENGTH } from '@/shared/api/contracts/catalog'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'

interface SearchDialogProps {
  trigger: ReactNode
}

export function SearchDialog({ trigger }: SearchDialogProps) {
  const inputId = useId()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [term, setTerm] = useState('')

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-surface-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar NFTs</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Pesquise por nome, ID do token, coleção ou criador.
          </DialogDescription>
        </DialogHeader>
        <form
          role="search"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const q = term.trim() || undefined
            setIsOpen(false)
            void navigate({ to: '/', search: { q }, hash: 'catalogo' })
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Termo de busca
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-price-muted"
            />
            <Input
              id={inputId}
              type="search"
              autoComplete="off"
              maxLength={MAX_SEARCH_LENGTH}
              placeholder="Explorar coleções"
              value={term}
              className="pl-11"
              onChange={(event) => {
                setTerm(event.target.value)
              }}
            />
          </div>
          <Button type="submit" className="self-end font-bold">
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
