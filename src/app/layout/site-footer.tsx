import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useId, useState, type ComponentType, type SVGProps } from 'react'
import { toast } from 'sonner'
import type { CategoryId } from '@/shared/api/contracts/catalog'
import { newsletterSubscriptionRequestSchema } from '@/shared/api/contracts/newsletter'
import { getErrorMessage } from '@/shared/api/api-error'
import { cn } from '@/shared/lib/cn'
import { ComingSoonBadge, ComingSoonItem } from '@/shared/ui/coming-soon'
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/shared/ui/brand-icons'
import { CATEGORY_LABELS } from '@/features/catalog/catalog-labels'
import { useNewsletterSubscription } from '@/features/newsletter/newsletter-api'

const FEATURES = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

interface ProfileLink {
  label: string
  to?: '/perfil' | '/perfil/favoritos'
}

const PROFILE_LINKS: readonly ProfileLink[] = [
  { label: 'Meu perfil', to: '/perfil' },
  { label: 'Minha coleção' },
  { label: 'Atividade' },
  { label: 'Estúdio do criador' },
  { label: 'Lista de interesse', to: '/perfil/favoritos' },
]

const HELP_LINKS = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
] as const

const FOOTER_CATEGORIES: readonly CategoryId[] = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'utility',
]

interface SocialLink {
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'Twitter', Icon: TwitterIcon },
  { label: 'LinkedIn', Icon: LinkedinIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
]

const COLUMN_TITLE = 'text-lg leading-4 font-bold text-foreground'
const COLUMN_ITEM =
  'cursor-pointer text-left text-sm leading-[1.875rem] text-foreground transition-colors hover:text-text-accent'

const COMING_SOON_ITEM = 'text-sm leading-[1.875rem] text-foreground'

function NewsletterForm() {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const subscription = useNewsletterSubscription()

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const parsed = newsletterSubscriptionRequestSchema.safeParse({ email })
        if (!parsed.success) {
          setError('Informe um e-mail válido')
          return
        }
        setError(null)
        subscription.mutate(parsed.data, {
          onSuccess: ({ status }) => {
            setEmail('')
            toast.success(
              status === 'subscribed'
                ? 'Inscrição confirmada. Você vai receber os próximos lançamentos.'
                : 'Este e-mail já está inscrito na newsletter.',
            )
          },
          onError: (caught) => {
            setError(getErrorMessage(caught))
          },
        })
      }}
    >
      <h2 className="text-lg leading-4 font-bold text-foreground">
        Antecipe-se ao próximo lançamento
      </h2>
      <div className="flex h-10 overflow-hidden rounded-md bg-surface-dark/45">
        <label htmlFor={inputId} className="sr-only">
          E-mail para receber novidades
        </label>
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          value={email}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm leading-4 text-foreground outline-none placeholder:text-price-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          onChange={(event) => {
            setEmail(event.target.value)
          }}
        />
        <button
          type="submit"
          disabled={subscription.isPending}
          aria-busy={subscription.isPending}
          className="flex w-[5.3125rem] cursor-pointer items-center justify-center rounded-tr-md rounded-br-md bg-primary text-lg leading-4 font-bold text-ink hover:bg-primary-light disabled:cursor-wait disabled:opacity-80"
        >
          {subscription.isPending ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              <span className="sr-only">Enviando</span>
            </>
          ) : (
            'Enviar'
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="-mt-2 text-xs text-text-coral">
          {error}
        </p>
      )}
    </form>
  )
}

export function SiteFooter() {
  return (
    <footer className="flex flex-col">
      <section
        aria-label="Destaques da Kurio"
        className="flex min-h-[15.625rem] items-center justify-center bg-surface-card px-6 py-6"
      >
        <div className="flex w-full max-w-[72.125rem] items-stretch">
          {FEATURES.map((feature) => (
            <div key={feature.mark} className="flex flex-1 items-stretch">
              <div className="flex flex-1 flex-col gap-3 px-4">
                <span
                  aria-hidden="true"
                  className="flex size-[4.625rem] items-center justify-center rounded-full bg-primary text-2xl leading-none font-bold text-ink"
                >
                  {feature.mark}
                </span>
                <h2 className="text-[1.0625rem] leading-4 font-bold text-foreground">
                  {feature.title}
                </h2>
                <p className="max-w-[12.75rem] text-sm leading-[1.375rem] text-text-secondary">
                  {feature.description}
                </p>
              </div>
              <span aria-hidden="true" className="w-px self-stretch bg-primary" />
            </div>
          ))}
          <div className="flex w-[17rem] shrink-0 flex-col gap-3 px-4 xl:w-[22.3125rem]">
            <NewsletterForm />
            <p className="text-[0.8125rem] leading-[1.375rem] text-text-secondary">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>
      </section>

      <div className="flex h-[5.5rem] items-center justify-center bg-surface-dark px-8">
        <div className="grid w-full max-w-[71rem] grid-cols-[1fr_1fr_1fr_14.25rem] items-center gap-6 text-sm leading-[1.375rem] text-foreground xl:gap-[5.75rem]">
          <span className="font-bold tracking-[0.1em]">KURIO</span>
          <span className="max-w-[13.6875rem] xl:w-[13.6875rem] xl:max-w-none">
            Feito para colecionadores, criadores e cultura
          </span>
          <a href="mailto:contato@email.com" className="hover:text-text-accent">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="hover:text-text-accent">
            +55 11 4002 8922
          </a>
        </div>
      </div>

      <div className="flex min-h-[14.75rem] items-center justify-center bg-surface-card px-8 py-8">
        <div className="grid w-full max-w-[71rem] grid-cols-[1fr_1fr_1fr_14.25rem] gap-8 xl:gap-[7.75rem]">
          <nav aria-labelledby="footer-perfil" className="flex flex-col gap-2">
            <h2 id="footer-perfil" className={COLUMN_TITLE}>
              Meu perfil
            </h2>
            <ul>
              {PROFILE_LINKS.map(({ label, to }) => (
                <li key={label}>
                  {to ? (
                    <Link to={to} className={COLUMN_ITEM}>
                      {label}
                    </Link>
                  ) : (
                    <ComingSoonItem className={COMING_SOON_ITEM} showBadge={false}>
                      {label}
                    </ComingSoonItem>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-ajuda" className="flex flex-col gap-2">
            <h2 id="footer-ajuda" className={COLUMN_TITLE}>
              Central de ajuda
            </h2>
            <ul>
              {HELP_LINKS.map((label) => (
                <li key={label}>
                  <ComingSoonItem className={COMING_SOON_ITEM} showBadge={false}>
                    {label}
                  </ComingSoonItem>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-colecoes" className="flex flex-col gap-2">
            <h2 id="footer-colecoes" className={COLUMN_TITLE}>
              Coleções
            </h2>
            <ul>
              {FOOTER_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    to="/"
                    search={{ categories: [category] }}
                    hash="catalogo"
                    className={COLUMN_ITEM}
                  >
                    {CATEGORY_LABELS[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <h2 className={cn(COLUMN_TITLE, 'flex items-center gap-2')}>
                Redes sociais
                <ComingSoonBadge />
              </h2>
              <ul className="flex gap-2.5">
                {SOCIAL_LINKS.map(({ label, Icon }) => (
                  <li
                    key={label}
                    className="flex size-[1.875rem] cursor-not-allowed items-center justify-center rounded border border-primary text-primary opacity-60"
                  >
                    <Icon className="size-4" />
                    <span className="sr-only">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className={COLUMN_TITLE}>Carteiras compatíveis</h2>
              <p className="flex h-[1.625rem] items-center rounded-md border border-border-soft bg-surface-dark px-2 text-[0.5625rem] leading-none font-bold tracking-[0.1px] text-text-accent">
                METAMASK • WALLETCONNECT • COINBASE
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm leading-[1.875rem] text-foreground">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
