import { Link, useRouterState } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { notifyUnavailableFeature } from '@/shared/lib/unavailable-feature'
import { Skeleton } from '@/shared/ui/skeleton'
import { useSession } from '@/features/auth/api/auth-queries'
import { UserMenu } from '@/features/auth/components/user-menu'
import { useAuthNavigation } from '@/features/auth/use-auth-navigation'
import { SearchDialog } from './search-dialog'

type NavSection = 'home' | 'market'

function useActiveSection(): NavSection {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return pathname === '/' ? 'home' : 'market'
}

const NAV_TEXT = 'text-base leading-none'

function NavIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn('h-[3px] w-full', isActive ? 'bg-primary' : 'bg-transparent')}
    />
  )
}

function navLabelClasses(isActive: boolean) {
  return cn(
    NAV_TEXT,
    'transition-colors hover:text-text-accent',
    isActive ? 'font-bold text-text-accent' : 'font-normal text-foreground',
  )
}

export function SiteHeader({ showDivider }: { showDivider: boolean }) {
  const activeSection = useActiveSection()

  return (
    <div className="flex flex-col">
      <header className="flex h-[2.8125rem] items-center justify-between">
        <Link
          to="/"
          className="flex w-40 items-center text-sm leading-none font-bold tracking-[0.1em] text-foreground"
          aria-label="Kurio, página inicial"
        >
          KURIO
        </Link>

        <nav aria-label="Principal">
          <ul className="flex h-[2.8125rem] items-start gap-10">
            <li className="flex flex-col gap-6">
              <Link
                to="/"
                aria-current={activeSection === 'home' ? 'page' : undefined}
                className={navLabelClasses(activeSection === 'home')}
              >
                Início
              </Link>
              <NavIndicator isActive={activeSection === 'home'} />
            </li>
            <li className="flex flex-col gap-6">
              <Link
                to="/"
                hash="catalogo"
                aria-current={activeSection === 'market' ? 'page' : undefined}
                className={navLabelClasses(activeSection === 'market')}
              >
                Mercado
              </Link>
              <NavIndicator isActive={activeSection === 'market'} />
            </li>
            <li className="flex flex-col gap-6">
              <button
                type="button"
                className={cn(navLabelClasses(false), 'cursor-pointer')}
                onClick={() => {
                  notifyUnavailableFeature('A página de criadores')
                }}
              >
                Criadores
              </button>
            </li>
            <li className="flex flex-col gap-6">
              <button
                type="button"
                className={cn(navLabelClasses(false), 'cursor-pointer')}
                onClick={() => {
                  notifyUnavailableFeature('A área de conteúdos')
                }}
              >
                Aprenda
              </button>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-7">
          <SearchDialog
            trigger={
              <button
                type="button"
                aria-label="Buscar NFTs"
                className="flex size-6 cursor-pointer items-center justify-center text-foreground hover:text-text-accent"
              >
                <Search aria-hidden="true" className="size-5" />
              </button>
            }
          />
          <button
            type="button"
            aria-label="Carrinho"
            className="relative flex h-6 w-[1.9375rem] cursor-pointer items-center text-foreground hover:text-text-accent"
            onClick={() => {
              notifyUnavailableFeature('O carrinho')
            }}
          >
            <ShoppingCart aria-hidden="true" className="size-6" />
          </button>
          <AccountAction />
        </div>
      </header>
      {showDivider && <div aria-hidden="true" className="h-px bg-primary/40" />}
    </div>
  )
}

function AccountAction() {
  const { user, isResolving } = useSession()
  const { openAuth } = useAuthNavigation()

  if (isResolving) {
    return <Skeleton className="h-[2.1875rem] w-[6.25rem] rounded-md" />
  }

  if (user) {
    return <UserMenu user={user} />
  }

  return (
    <button
      type="button"
      className="flex h-[2.1875rem] w-[6.25rem] cursor-pointer items-center justify-center gap-1 rounded-md bg-primary text-base leading-none font-medium text-ink hover:bg-primary-light"
      onClick={() => {
        openAuth('entrar')
      }}
    >
      <LogIn aria-hidden="true" className="size-5" />
      Entrar
    </button>
  )
}
