import type { NftSummary } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'

interface HeroCarouselDotsProps {
  slides: readonly NftSummary[]
  activeIndex: number
  onSelect: (index: number) => void
  dotClassName: string
  gapClassName: string
}

export function HeroCarouselDots({
  slides,
  activeIndex,
  onSelect,
  dotClassName,
  gapClassName,
}: HeroCarouselDotsProps) {
  return (
    <div role="group" aria-label="Destaques" className={cn('flex', gapClassName)}>
      {slides.map((slide, index) => {
        const isActive = index === activeIndex
        return (
          <button
            key={slide.id}
            type="button"
            aria-label={`Mostrar destaque ${index + 1} de ${slides.length}: ${slide.name}`}
            aria-pressed={isActive}
            onClick={() => {
              onSelect(index)
            }}
            className="flex size-6 cursor-pointer items-center justify-center"
          >
            <span
              aria-hidden="true"
              className={cn(
                'rounded-full bg-primary transition-opacity',
                dotClassName,
                isActive ? 'opacity-100' : 'opacity-50',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
