import { createFileRoute } from '@tanstack/react-router'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { catalogSearchSchema } from '@/features/catalog/catalog-search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-16 py-12 md:py-16">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-medium tracking-[0.1em]">Bem-vindo à Kurio</p>
        <h1 className="max-w-[37.5rem] text-3xl leading-tight font-bold uppercase md:text-[2.6875rem] md:leading-[4.375rem]">
          Seja dono do futuro da arte digital
        </h1>
        <p className="max-w-[34.8125rem] text-sm leading-6 text-text-secondary">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
          rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
      </header>
      <CatalogSection />
    </div>
  )
}
