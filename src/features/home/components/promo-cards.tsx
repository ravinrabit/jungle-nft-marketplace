import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { ArtworkSlug } from '@/shared/api/contracts/catalog'
import type { CatalogSearch } from '@/features/catalog/catalog-search'
import { NftArtwork } from '@/features/catalog/components/nft-artwork'

interface Promo {
  id: string
  title: string
  description: string
  artwork: ArtworkSlug
  imageAlt: string
  search: CatalogSearch
}

const PROMOS: readonly Promo[] = [
  {
    id: 'genesis',
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    artwork: 'emerald-ape',
    imageAlt: 'Macaco de óculos redondos e jaqueta universitária verde',
    search: { tab: 'new' },
  },
  {
    id: 'curated',
    title: 'Arte digital selecionada e muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    artwork: 'ivory-baron',
    imageAlt: 'Chimpanzé de blusa de gola alta verde e blazer bege',
    search: { categories: ['digital-art'] },
  },
]

export function PromoCards() {
  return (
    <section aria-label="Coleções em destaque" className="grid gap-6 lg:grid-cols-2 lg:gap-7">
      {PROMOS.map((promo) => (
        <article
          key={promo.id}
          className="relative flex min-h-[15.625rem] overflow-hidden rounded-lg bg-surface-card"
        >
          <span
            aria-hidden="true"
            className="absolute top-[-0.1875rem] left-[-5.5rem] size-64 rounded-full border-2 border-primary"
          />
          <span
            aria-hidden="true"
            className="absolute top-2 left-[-4.5rem] size-64 rounded-full border border-primary"
          />
          <div className="relative w-1/2 shrink-0 overflow-hidden rounded-[1.125rem]">
            <NftArtwork
              artwork={promo.artwork}
              alt={promo.imageAlt}
              sizes="(min-width: 900px) 292px, 50vw"
              className="h-full object-cover"
            />
          </div>
          <div className="relative flex flex-1 flex-col items-end justify-center gap-2 px-4 py-6 text-right">
            <h2 className="max-w-[13rem] text-lg leading-6 font-bold text-foreground">
              {promo.title}
            </h2>
            <p className="max-w-[16.5rem] text-sm leading-6 text-text-secondary">
              {promo.description}
            </p>
            <Link
              to="/"
              search={promo.search}
              hash="catalogo"
              className="mt-1 flex h-10 w-[8.75rem] items-center justify-center gap-1 rounded-md bg-primary text-sm leading-5 font-medium text-ink transition-colors hover:bg-primary-light"
            >
              Explorar
              <ArrowRight aria-hidden="true" className="size-[1.125rem]" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}
