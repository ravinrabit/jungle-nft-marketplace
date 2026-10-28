import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Heart, ShoppingCart, Star } from 'lucide-react'
import type { EditionKind, NftDetail } from '@/shared/api/contracts/catalog'
import { formatEth } from '@/shared/lib/eth'
import { notifyUnavailableFeature } from '@/shared/lib/unavailable-feature'
import { QuantityStepper } from '@/shared/ui/quantity-stepper'
import { usePurchaseSelection } from '../use-purchase-selection'
import { EditionSelector } from './edition-selector'
import { GalleryIndicator, NftGallery } from './nft-gallery'
import { NftArtwork } from '@/features/catalog/components/nft-artwork'
import { NftDescriptionTabs } from './nft-description-tabs'
import { RatingStars } from './rating-stars'
import { RelatedNfts } from './related-nfts'
import { ShareLinks } from './share-links'

interface NftDetailViewProps {
  nft: NftDetail
  requestedEdition: EditionKind | undefined
  onSelectEdition: (kind: EditionKind) => void
}

function TokenInfo({ nft }: { nft: NftDetail }) {
  return (
    <dl className="flex flex-col gap-3 text-[0.9375rem] leading-none text-price-muted">
      <div className="flex gap-1">
        <dt>ID do token:</dt>
        <dd>{nft.tokenId}</dd>
      </div>
      <div className="flex gap-1">
        <dt>Coleção:</dt>
        <dd>{nft.collectionName}</dd>
      </div>
      <div className="flex gap-1">
        <dt>Atributos:</dt>
        <dd>{nft.attributes.join(', ')}</dd>
      </div>
    </dl>
  )
}

function SoldOutNotice() {
  return (
    <p role="status" className="text-sm font-medium text-text-coral">
      Esta edição está esgotada. Escolha outra edição para comprar.
    </p>
  )
}

export function NftDetailView({ nft, requestedEdition, onSelectEdition }: NftDetailViewProps) {
  const router = useRouter()
  const { edition, quantity, maxQuantity, isAvailable, setQuantity } = usePurchaseSelection(
    nft,
    requestedEdition,
  )
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href

  const handleBuy = () => {
    notifyUnavailableFeature('A compra')
  }
  const handleFavorite = () => {
    notifyUnavailableFeature('Favoritar')
  }

  return (
    <div className="flex flex-col gap-12 pb-28 lg:gap-24 lg:pb-0">
      <div className="hidden lg:block">
        <div className="flex flex-col gap-3">
          <nav aria-label="Trilha de navegação">
            <ol className="flex gap-1 text-[0.9375rem] leading-4 font-bold text-foreground">
              <li>
                <Link to="/" className="hover:text-text-accent">
                  Início
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/" hash="catalogo" className="hover:text-text-accent">
                  Mercado
                </Link>
              </li>
            </ol>
          </nav>

          <article className="flex gap-8">
            <NftGallery nft={nft} />

            <div className="flex min-h-[28rem] flex-1 flex-col justify-between">
              <div className="flex flex-col gap-3">
                <h1 className="text-[1.75rem] leading-none font-bold text-foreground">
                  {nft.name}
                </h1>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[1.375rem] leading-4 font-bold text-text-accent">
                    <span className="sr-only">Preço da edição selecionada: </span>
                    {formatEth(edition.price)}
                  </p>
                  <div className="flex items-center gap-1">
                    <RatingStars average={nft.rating.average} />
                    <span className="text-[0.9375rem] leading-none text-foreground">
                      {nft.rating.count} avaliações de colecionadores
                    </span>
                  </div>
                </div>
                <div aria-hidden="true" className="h-px bg-primary/40" />
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-[0.9375rem] leading-4 font-bold text-foreground">
                  Sobre este NFT:
                </h2>
                <p className="max-w-[35.875rem] text-sm leading-6 text-text-secondary">
                  {nft.description}
                </p>
              </div>

              <EditionSelector
                editions={nft.editions}
                selected={edition.kind}
                onSelect={onSelectEdition}
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <QuantityStepper
                    label="Quantidade"
                    value={quantity}
                    max={Math.max(maxQuantity, 1)}
                    disabled={!isAvailable}
                    onChange={setQuantity}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={handleBuy}
                      className="h-10 w-[8.125rem] cursor-pointer rounded-md bg-primary text-sm leading-5 font-bold text-ink uppercase transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Comprar
                    </button>
                    <button
                      type="button"
                      onClick={handleFavorite}
                      className="flex h-10 w-[8.125rem] cursor-pointer items-center justify-center gap-2 rounded-md border border-primary text-sm leading-5 font-medium text-text-accent transition-colors hover:bg-surface-raised"
                    >
                      <Heart aria-hidden="true" className="size-5" />
                      Favoritar
                    </button>
                  </div>
                </div>
                {!isAvailable && <SoldOutNotice />}
              </div>

              <div className="flex flex-col gap-3">
                <TokenInfo nft={nft} />
                <ShareLinks nftName={nft.name} url={shareUrl} />
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="-mx-6 -mt-10 flex flex-col lg:hidden">
        <div className="flex h-[31.625rem] flex-col items-center gap-2 bg-linear-to-b from-surface-card to-surface-raised px-6 pt-10">
          <div className="flex w-full max-w-[22.5625rem] items-center justify-between">
            <button
              type="button"
              aria-label="Voltar"
              className="flex size-[2.1875rem] cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-text-secondary"
              onClick={() => {
                router.history.back()
              }}
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              aria-label={`Favoritar ${nft.name}`}
              className="flex size-[2.1875rem] cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-primary"
              onClick={handleFavorite}
            >
              <Heart aria-hidden="true" className="size-5" />
            </button>
          </div>
          <NftArtwork
            artwork={nft.artwork}
            alt={nft.imageAlt}
            sizes="(min-width: 640px) 361px, 90vw"
            priority
            className="aspect-[361/356] w-full max-w-[22.5625rem] rounded-3xl"
          />
          <GalleryIndicator activeIndex={0} total={nft.gallery.length} />
        </div>

        <article className="-mt-2 flex flex-col gap-3 rounded-t-[2.5rem] bg-surface-card px-6 pt-8 pb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl leading-4 font-bold text-foreground">{nft.name}</h1>
            <p className="flex h-[1.6875rem] items-center gap-1 rounded-full border border-primary px-2 text-sm leading-4">
              <Star aria-hidden="true" className="size-3.5 fill-amber text-amber" />
              <span className="font-medium text-foreground">
                <span className="sr-only">Nota </span>
                {nft.rating.average}
              </span>
              <span className="text-text-secondary">
                ({nft.rating.count}
                <span className="sr-only"> avaliações</span>)
              </span>
            </p>
          </div>
          <p className="text-sm leading-6 text-text-secondary">{nft.description}</p>
          <EditionSelector
            editions={nft.editions}
            selected={edition.kind}
            onSelect={onSelectEdition}
          />
          <TokenInfo nft={nft} />
          {!isAvailable && <SoldOutNotice />}
        </article>
      </div>

      <NftDescriptionTabs nft={nft} />
      <RelatedNfts nftId={nft.id} />

      <div className="lg:hidden">
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-5 rounded-t-[2.5rem] bg-surface-card/95 px-6 pt-5 pb-9 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[0.9375rem] leading-4 font-medium text-text-secondary">
                Qtd.
              </span>
              <QuantityStepper
                size="small"
                label="Quantidade"
                value={quantity}
                max={Math.max(maxQuantity, 1)}
                disabled={!isAvailable}
                onChange={setQuantity}
              />
            </div>
            <p className="text-xl leading-4 font-bold text-text-accent">
              <span className="sr-only">Preço da edição selecionada: </span>
              {formatEth(edition.price)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!isAvailable}
              onClick={handleBuy}
              className="h-[3.75rem] w-[12.25rem] cursor-pointer rounded-[2.5rem] bg-linear-to-r from-primary to-primary-dark text-base leading-5 font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Comprar NFT
            </button>
            <button
              type="button"
              aria-label="Adicionar ao carrinho"
              disabled={!isAvailable}
              onClick={handleBuy}
              className="flex size-[3.75rem] shrink-0 cursor-pointer items-center justify-center rounded-[2.5rem] border border-border bg-surface-raised text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
