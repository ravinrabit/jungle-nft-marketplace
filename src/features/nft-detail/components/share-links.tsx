import { Mail } from 'lucide-react'
import { LinkedinIcon, TwitterIcon } from '@/shared/ui/brand-icons'

interface ShareLinksProps {
  nftName: string
  url: string
}

const SHARE_LINK =
  'flex size-6 items-center justify-center text-foreground transition-colors hover:text-text-accent'

export function ShareLinks({ nftName, url }: ShareLinksProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(`Confira ${nftName} na Kurio`)

  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.9375rem] leading-4 font-bold text-foreground">
        Compartilhar este NFT:
      </span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no LinkedIn (abre em nova aba)"
        className={SHARE_LINK}
      >
        <LinkedinIcon className="size-[0.9375rem]" />
      </a>
      <a
        href={`mailto:?subject=${encodedText}&body=${encodedUrl}`}
        aria-label="Compartilhar por e-mail"
        className={SHARE_LINK}
      >
        <Mail aria-hidden="true" className="size-[1.125rem]" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Twitter (abre em nova aba)"
        className={SHARE_LINK}
      >
        <TwitterIcon className="size-4" />
      </a>
    </div>
  )
}
