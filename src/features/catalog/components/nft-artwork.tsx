import type { ArtworkSlug } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'

const ARTWORK_WIDTHS = [160, 320, 640, 960] as const
const FALLBACK_WIDTH = 640

function artworkUrl(artwork: ArtworkSlug, width: number) {
  return `/images/nfts/${artwork}-${width}.webp`
}

interface NftArtworkProps {
  artwork: ArtworkSlug
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}

export function NftArtwork({ artwork, alt, sizes, priority = false, className }: NftArtworkProps) {
  return (
    <img
      src={artworkUrl(artwork, FALLBACK_WIDTH)}
      srcSet={ARTWORK_WIDTHS.map((width) => `${artworkUrl(artwork, width)} ${width}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      width={FALLBACK_WIDTH}
      height={FALLBACK_WIDTH}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('aspect-square w-full object-cover', className)}
    />
  )
}
