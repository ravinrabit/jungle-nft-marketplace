import { Star } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const STAR_COUNT = 5

interface RatingStarsProps {
  average: string
  className?: string
}

export function RatingStars({ average, className }: RatingStarsProps) {
  const filled = Math.round(Number(average))

  return (
    <span
      role="img"
      aria-label={`Nota ${average.replace('.', ',')} de ${STAR_COUNT}`}
      className={cn('flex gap-1', className)}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            'size-[0.9375rem]',
            index < filled
              ? 'fill-primary text-primary'
              : 'fill-text-secondary text-text-secondary',
          )}
        />
      ))}
    </span>
  )
}
