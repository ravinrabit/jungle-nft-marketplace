import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { CatalogSearch } from '../catalog-search'

interface CatalogPaginationProps {
  page: number
  totalPages: number
}

const PAGE_LINK_CLASSES =
  'inline-flex size-[2.1875rem] items-center justify-center rounded border border-border text-lg leading-4 text-foreground transition-colors hover:border-primary hover:text-text-accent'

function pageSearch(page: number) {
  return (previous: CatalogSearch): CatalogSearch => ({
    ...previous,
    page: page > 1 ? page : undefined,
  })
}

export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <Link
              to="/"
              search={pageSearch(page - 1)}
              hash="catalogo"
              className={PAGE_LINK_CLASSES}
              aria-label="Página anterior"
            >
              <ChevronLeft aria-hidden="true" className="size-[1.125rem]" />
            </Link>
          </li>
        )}
        {pages.map((pageNumber) => {
          const isCurrent = pageNumber === page
          return (
            <li key={pageNumber}>
              <Link
                to="/"
                search={pageSearch(pageNumber)}
                hash="catalogo"
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Página ${pageNumber}`}
                className={cn(
                  PAGE_LINK_CLASSES,
                  isCurrent && 'border-primary bg-primary font-bold text-ink hover:text-ink',
                )}
              >
                {pageNumber}
              </Link>
            </li>
          )
        })}
        {page < totalPages && (
          <li>
            <Link
              to="/"
              search={pageSearch(page + 1)}
              hash="catalogo"
              className={PAGE_LINK_CLASSES}
              aria-label="Próxima página"
            >
              <ChevronRight aria-hidden="true" className="size-[1.125rem]" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
