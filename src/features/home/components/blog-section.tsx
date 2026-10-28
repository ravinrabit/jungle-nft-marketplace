import type { ArtworkSlug } from '@/shared/api/contracts/catalog'
import { notifyUnavailableFeature } from '@/shared/lib/unavailable-feature'
import { NftArtwork } from '@/features/catalog/components/nft-artwork'

interface BlogPost {
  id: string
  date: string
  readingTime: string
  title: string
  excerpt: string
  artwork: ArtworkSlug
}

const POSTS: readonly BlogPost[] = [
  {
    id: 'propriedade',
    date: '12 de setembro',
    readingTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    artwork: 'ivory-baron',
  },
  {
    id: 'artistas',
    date: '13 de setembro',
    readingTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    artwork: 'emerald-ape',
  },
  {
    id: 'raridade',
    date: '15 de setembro',
    readingTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    artwork: 'sage-nomad',
  },
  {
    id: 'carteira',
    date: '15 de setembro',
    readingTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    artwork: 'golden-beat',
  },
]

export function BlogSection() {
  return (
    <section aria-labelledby="blog-titulo" className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 text-center">
        <h2 id="blog-titulo" className="text-[1.75rem] leading-none font-bold text-text-primary">
          Diário da Cunhagem
        </h2>
        <p className="text-sm leading-none text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:flex">
        {POSTS.map((post) => (
          <li key={post.id} className="lg:w-[16.75rem]">
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-surface-card">
              <div className="h-[12.1875rem] overflow-hidden">
                <NftArtwork
                  artwork={post.artwork}
                  alt=""
                  sizes="(min-width: 1024px) 268px, 50vw"
                  className="h-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                <p className="text-xs leading-4 font-medium text-text-secondary">
                  <time>{post.date}</time> | {post.readingTime}
                </p>
                <h3 className="text-base leading-none font-bold text-text-primary">{post.title}</h3>
                <p className="text-xs leading-4 font-medium text-text-secondary">{post.excerpt}</p>
                <button
                  type="button"
                  aria-label={`Ler mais sobre ${post.title}`}
                  className="mt-auto flex cursor-pointer items-center gap-1 text-xs leading-[0.875rem] font-bold text-text-accent hover:underline"
                  onClick={() => {
                    notifyUnavailableFeature('O conteúdo editorial')
                  }}
                >
                  Ler mais <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
