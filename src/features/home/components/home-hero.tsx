import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import type { NftSummary } from '@/shared/api/contracts/catalog'
import { Skeleton } from '@/shared/ui/skeleton'
import { featuredNftsQueryOptions } from '@/features/catalog/api/catalog-queries'
import { NftArtwork } from '@/features/catalog/components/nft-artwork'
import { HeroCarouselDots } from './hero-carousel-dots'

function useHeroSlides() {
  const query = useQuery(featuredNftsQueryOptions())
  const [activeIndex, setActiveIndex] = useState(0)
  const slides = query.data?.hero ?? []
  const active = slides[activeIndex] ?? slides[0]
  return { slides, active, activeIndex, setActiveIndex, isPending: query.isPending }
}

function HeroArtworkLink({
  nft,
  sizes,
  className,
}: {
  nft: NftSummary
  sizes: string
  className: string
}) {
  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: nft.id }}
      aria-label={`Ver ${nft.name}`}
      className={className}
    >
      <NftArtwork
        artwork={nft.artwork}
        alt={nft.imageAlt}
        sizes={sizes}
        priority
        className="h-full object-cover"
      />
    </Link>
  )
}

export function DesktopHero() {
  const { slides, active, activeIndex, setActiveIndex, isPending } = useHeroSlides()

  return (
    <section
      aria-labelledby="hero-titulo"
      className="hidden h-[28.125rem] items-center justify-between pl-10 lg:flex"
    >
      <div className="flex w-[37.5rem] flex-col gap-11">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-2">
              <p className="text-sm leading-4 font-medium tracking-[0.1em] text-foreground">
                Bem-vindo à Kurio
              </p>
              <h1
                id="hero-titulo"
                className="text-[2.6875rem] leading-[4.375rem] font-bold text-foreground uppercase"
              >
                <span className="block">Seja dono do futuro</span>
                <span className="block">da arte digital</span>
              </h1>
            </div>
            <p className="max-w-[34.8125rem] text-sm leading-6 text-text-secondary">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
          </div>
          <Link
            to="/"
            hash="catalogo"
            className="flex h-10 w-[8.75rem] items-center justify-center rounded-md bg-primary text-base leading-5 font-bold text-ink uppercase transition-colors hover:bg-primary-light"
          >
            Explorar
          </Link>
        </div>
        {slides.length > 1 && (
          <HeroCarouselDots
            slides={slides}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            dotClassName="size-2"
            gapClassName="-mx-2 gap-0"
          />
        )}
      </div>
      {isPending || !active ? (
        <Skeleton className="size-[28.125rem] rounded-3xl" />
      ) : (
        <HeroArtworkLink
          nft={active}
          sizes="450px"
          className="block size-[28.125rem] overflow-hidden rounded-3xl"
        />
      )}
    </section>
  )
}

export function MobileHero() {
  const { slides, active, activeIndex, setActiveIndex, isPending } = useHeroSlides()
  const secondary = slides[(activeIndex + 1) % Math.max(slides.length, 1)]

  return (
    <section
      aria-labelledby="hero-mobile-titulo"
      className="relative flex h-[11.875rem] flex-col overflow-hidden rounded-[1.875rem] bg-primary/20 px-4 pt-3 pb-6 lg:hidden"
    >
      <span
        aria-hidden="true"
        className="absolute -top-16 -left-10 size-[15.5rem] rounded-full bg-linear-to-br from-primary-light/40 to-primary/30"
      />
      <span
        aria-hidden="true"
        className="absolute -right-16 -bottom-24 size-[15.5rem] rounded-full bg-linear-to-br from-primary-light/35 to-primary/25"
      />
      <div className="relative flex gap-2">
        <div className="flex w-[11.75rem] min-w-0 flex-col justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs leading-4 font-medium text-foreground">Bem-vindo à Kurio</p>
            <h1
              id="hero-mobile-titulo"
              className="text-lg leading-[1.8125rem] font-bold text-foreground uppercase"
            >
              Seja dono da cultura digital
            </h1>
            <p className="text-xs leading-[1.125rem] text-text-secondary">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
          </div>
          <Link
            to="/"
            hash="catalogo"
            className="flex items-center gap-2 text-xs leading-[0.875rem] font-bold text-text-accent uppercase"
          >
            Explorar
            <ArrowRight aria-hidden="true" className="size-4 text-primary" />
          </Link>
        </div>
        <div className="relative ml-auto h-[9.125rem] w-[8.625rem] shrink-0">
          {isPending || !active ? (
            <Skeleton className="size-[8.625rem] rounded-2xl" />
          ) : (
            <>
              <HeroArtworkLink
                nft={active}
                sizes="138px"
                className="block size-[8.625rem] overflow-hidden rounded-2xl"
              />
              {secondary && secondary.id !== active.id && (
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 size-[3.625rem] overflow-hidden rounded-2xl border-2 border-surface-card/30"
                >
                  <NftArtwork
                    artwork={secondary.artwork}
                    alt=""
                    sizes="58px"
                    className="h-full object-cover"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <HeroCarouselDots
            slides={slides}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            dotClassName="size-[0.4375rem]"
            gapClassName="gap-0"
          />
        </div>
      )}
    </section>
  )
}
