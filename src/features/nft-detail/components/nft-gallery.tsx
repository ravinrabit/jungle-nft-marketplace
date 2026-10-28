import { ZoomIn } from 'lucide-react'
import { useState } from 'react'
import type { NftDetail } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { NftArtwork } from '@/features/catalog/components/nft-artwork'

interface NftGalleryProps {
  nft: NftDetail
}

function imageLabel(index: number, total: number) {
  return `Imagem ${index + 1} de ${total}`
}

export function NftGallery({ nft }: NftGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeArtwork = nft.gallery[activeIndex] ?? nft.artwork
  const total = nft.gallery.length

  return (
    <div className="flex gap-7">
      <ul
        aria-label="Miniaturas"
        className="hidden w-[6.25rem] shrink-0 flex-col gap-4 min-[64rem]:flex"
      >
        {nft.gallery.map((artwork, index) => {
          const isActive = index === activeIndex
          return (
            <li key={`${artwork}-${index}`}>
              <button
                type="button"
                aria-label={imageLabel(index, total)}
                aria-pressed={isActive}
                className={cn(
                  'block size-[6.25rem] cursor-pointer overflow-hidden rounded-lg border transition-colors',
                  isActive ? 'border-primary' : 'border-transparent hover:border-border-soft',
                )}
                onClick={() => {
                  setActiveIndex(index)
                }}
              >
                <NftArtwork
                  artwork={artwork}
                  alt=""
                  sizes="100px"
                  className="h-full object-cover"
                />
              </button>
            </li>
          )
        })}
      </ul>

      <div className="relative flex size-[22rem] shrink-0 items-center justify-center rounded-md bg-surface-card min-[64rem]:size-[27.75rem]">
        <NftArtwork
          artwork={activeArtwork}
          alt={`${nft.imageAlt}. ${imageLabel(activeIndex, total)}`}
          sizes="404px"
          priority
          className="size-[20rem] rounded-3xl min-[64rem]:size-[25.25rem]"
        />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute top-3 right-3 flex size-[1.875rem] cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-foreground transition-colors hover:text-text-accent"
            >
              <ZoomIn aria-hidden="true" className="size-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[min(90vw,48rem)] border-border bg-surface-card p-4 sm:max-w-[min(90vw,48rem)]">
            <DialogTitle className="sr-only">{nft.name}</DialogTitle>
            <DialogDescription className="sr-only">Imagem ampliada do NFT.</DialogDescription>
            <NftArtwork
              artwork={activeArtwork}
              alt={nft.imageAlt}
              sizes="(min-width: 768px) 768px, 90vw"
              className="rounded-2xl"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export function GalleryIndicator({ activeIndex, total }: { activeIndex: number; total: number }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-2">
      {Array.from({ length: Math.min(total, 3) }, (_, index) => (
        <span
          key={index}
          className={cn(
            'h-[0.4375rem] rounded-full bg-primary transition-all',
            index === activeIndex ? 'w-7' : 'w-[0.4375rem]',
          )}
        />
      ))}
    </div>
  )
}
