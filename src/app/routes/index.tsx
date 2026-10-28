import { createFileRoute } from '@tanstack/react-router'
import { catalogSearchSchema } from '@/features/catalog/catalog-search'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { MobileCatalogBar } from '@/features/catalog/components/mobile-catalog-bar'
import { BlogSection } from '@/features/home/components/blog-section'
import { DesktopHero, MobileHero } from '@/features/home/components/home-hero'
import { PromoCards } from '@/features/home/components/promo-cards'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-4 lg:gap-24">
      <MobileCatalogBar />
      <DesktopHero />
      <MobileHero />
      <CatalogSection />
      <div className="mt-12 flex flex-col gap-12 lg:mt-0 lg:gap-24">
        <PromoCards />
        <BlogSection />
      </div>
    </div>
  )
}
