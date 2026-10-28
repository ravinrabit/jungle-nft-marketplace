import { useId, useState, type KeyboardEvent } from 'react'
import type { NftDetail } from '@/shared/api/contracts/catalog'
import { cn } from '@/shared/lib/cn'
import { NETWORK_LABELS } from '@/features/catalog/catalog-labels'
import { RatingStars } from './rating-stars'

type DescriptionTab = 'details' | 'reviews'

const TAB_ORDER: readonly DescriptionTab[] = ['details', 'reviews']

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`.toUpperCase().replace('0X', '0x')
}

const reviewDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function DetailsPanel({ nft }: { nft: NftDetail }) {
  const blocks = [
    {
      title: 'Rede:',
      text: `Cunhado na ${NETWORK_LABELS[nft.network]} com procedência imutável e metadados armazenados no IPFS.`,
    },
    {
      title: 'Contrato:',
      text: `Direitos autorais do criador: ${nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
    },
    {
      title: 'Direitos autorais:',
      text: `${shortenAddress(nft.contractAddress)} • Contrato inteligente ERC-721 verificado.`,
    },
  ]

  return (
    <div className="flex flex-col gap-3 text-sm leading-6">
      <div className="flex flex-col gap-6 text-text-secondary">
        {nft.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <dl>
        {blocks.map((block) => (
          <div key={block.title}>
            <dt className="font-bold text-foreground">{block.title}</dt>
            <dd className="text-text-secondary">{block.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ReviewsPanel({ nft }: { nft: NftDetail }) {
  return (
    <ul className="flex flex-col gap-4">
      {nft.reviews.map((review) => (
        <li key={review.id} className="flex flex-col gap-2 rounded-md bg-surface-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-foreground">{review.authorName}</span>
            <RatingStars average={String(review.rating)} />
            <time dateTime={review.createdAt} className="text-xs text-text-secondary">
              {reviewDateFormatter.format(new Date(review.createdAt))}
            </time>
          </div>
          <p className="text-sm leading-6 text-text-secondary">{review.comment}</p>
        </li>
      ))}
    </ul>
  )
}

export function NftDescriptionTabs({ nft }: { nft: NftDetail }) {
  const baseId = useId()
  const [activeTab, setActiveTab] = useState<DescriptionTab>('details')
  const labels: Record<DescriptionTab, string> = {
    details: 'Detalhes do NFT',
    reviews: `Avaliações de colecionadores (${nft.rating.count})`,
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return
    }
    event.preventDefault()
    const nextTab = activeTab === 'details' ? 'reviews' : 'details'
    setActiveTab(nextTab)
    document.getElementById(`${baseId}-tab-${nextTab}`)?.focus()
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col">
        <div role="tablist" aria-label="Informações do NFT" className="flex items-start gap-8">
          {TAB_ORDER.map((tab) => {
            const isActive = tab === activeTab
            return (
              <button
                key={tab}
                id={`${baseId}-tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${baseId}-panel-${tab}`}
                tabIndex={isActive ? 0 : -1}
                onKeyDown={handleKeyDown}
                onClick={() => {
                  setActiveTab(tab)
                }}
                className={cn(
                  'flex cursor-pointer flex-col gap-3 text-[1.0625rem] leading-4 transition-colors hover:text-text-accent',
                  isActive ? 'font-bold text-text-accent' : 'font-normal text-foreground',
                )}
              >
                {labels[tab]}
                <span
                  aria-hidden="true"
                  className={cn('h-[3px] w-full', isActive ? 'bg-primary' : 'bg-transparent')}
                />
              </button>
            )
          })}
        </div>
        <div aria-hidden="true" className="h-px bg-primary/40" />
      </div>
      {TAB_ORDER.map((tab) => (
        <div
          key={tab}
          id={`${baseId}-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab}`}
          hidden={tab !== activeTab}
        >
          {tab === 'details' ? <DetailsPanel nft={nft} /> : <ReviewsPanel nft={nft} />}
        </div>
      ))}
    </section>
  )
}
