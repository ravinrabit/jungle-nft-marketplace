import { Link, useRouterState } from '@tanstack/react-router'
import {
  Activity,
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingBag,
  TriangleAlert,
  User,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { notifyUnavailableFeature } from '@/shared/lib/unavailable-feature'
import { useSignOut } from '@/features/auth/use-sign-out'

type AccountRoute = '/perfil' | '/perfil/carteiras'

interface NavigationItem {
  label: string
  Icon: LucideIcon
  to?: AccountRoute
}

const ITEMS: readonly NavigationItem[] = [
  { label: 'Dados do perfil', Icon: User, to: '/perfil' },
  { label: 'Carteiras', Icon: MapPin, to: '/perfil/carteiras' },
  { label: 'Atividade', Icon: ShoppingBag },
  { label: 'Lista de interesse', Icon: Heart },
  { label: 'Ofertas', Icon: Activity },
  { label: 'Arquivos baixados', Icon: Download },
  { label: 'Suporte', Icon: TriangleAlert },
]

const ITEM_CLASSES =
  'flex h-[2.8125rem] w-full shrink-0 cursor-pointer items-center gap-3 px-4 text-[0.9375rem] leading-[2.8125rem] whitespace-nowrap text-text-accent transition-colors hover:bg-surface-raised'

export function AccountSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { signOut, isSigningOut } = useSignOut()

  return (
    <nav
      aria-label="Minha conta"
      className="flex shrink-0 flex-col bg-surface-card py-2 lg:w-[19.375rem] lg:self-start"
    >
      <h2 className="flex h-9 items-center px-2.5 text-lg leading-4 font-bold text-foreground">
        Meu perfil
      </h2>
      <ul className="flex overflow-x-auto lg:flex-col lg:overflow-visible">
        {ITEMS.map(({ label, Icon, to }) => {
          const isActive = to === pathname.replace(/\/$/, '')
          const content = (
            <>
              <Icon aria-hidden="true" className="size-[1.125rem] shrink-0 text-price-muted" />
              {label}
            </>
          )

          return (
            <li key={label} className="shrink-0">
              {to ? (
                <Link
                  to={to}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    ITEM_CLASSES,
                    isActive &&
                      'border-b-2 border-primary lg:border-b-0 lg:border-l-[5px] lg:pl-1.5',
                  )}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  className={ITEM_CLASSES}
                  onClick={() => {
                    notifyUnavailableFeature(label)
                  }}
                >
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <span aria-hidden="true" className="hidden h-px bg-primary/40 lg:block" />
      <button
        type="button"
        disabled={isSigningOut}
        className="hidden h-10 cursor-pointer items-center gap-2 px-4 text-[0.9375rem] leading-[0.9375rem] font-bold text-text-accent hover:bg-surface-raised disabled:opacity-60 lg:flex"
        onClick={signOut}
      >
        <LogOut aria-hidden="true" className="size-4" />
        Sair
      </button>
    </nav>
  )
}
