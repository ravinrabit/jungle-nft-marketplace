import { Link, useRouterState } from '@tanstack/react-router'
import { Heart, House, ScanLine } from 'lucide-react'
import { MobileAccountButton } from '@/features/auth/components/mobile-account-button'
import { CartLink } from '@/features/cart/components/cart-link'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { notifyUnavailableFeature } from '@/shared/lib/unavailable-feature'
import { SearchDialog } from './search-dialog'

const BAR_SHAPE =
  'M0 24 Q0 0 24 0 H150 C168 0 172 6 178 16 C186 31 196 40 207 40 C218 40 228 31 236 16 C242 6 246 0 264 0 H390 Q414 0 414 24 V95 H0 Z'

const HIDDEN_ON_PATH_PREFIXES = ['/nfts/', '/carrinho', '/pagamento'] as const

const ICON_BUTTON =
  'flex size-11 cursor-pointer items-center justify-center text-text-secondary transition-colors hover:text-text-accent'

function TabButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" aria-label={label} className={ICON_BUTTON} onClick={onClick}>
      {children}
    </button>
  )
}

export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isHome = pathname === '/'

  if (HIDDEN_ON_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 h-[5.9375rem] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 414 95"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        <path d={BAR_SHAPE} className="fill-surface-card" fillOpacity={0.97} />
      </svg>

      <ul className="relative grid h-full grid-cols-5 items-center px-6">
        <li className="flex justify-center">
          <Link
            to="/"
            aria-label="Início"
            aria-current={isHome ? 'page' : undefined}
            className={cn(ICON_BUTTON, isHome && 'text-text-accent')}
          >
            <House aria-hidden="true" className="size-5" fill={isHome ? 'currentColor' : 'none'} />
          </Link>
        </li>
        <li className="flex justify-center">
          <TabButton
            label="Favoritos"
            onClick={() => {
              notifyUnavailableFeature('A lista de favoritos')
            }}
          >
            <Heart aria-hidden="true" className="size-5" />
          </TabButton>
        </li>
        <li className="flex justify-center">
          <SearchDialog
            trigger={
              <button
                type="button"
                aria-label="Buscar NFTs"
                className="-mt-[4.25rem] flex size-[4.0625rem] cursor-pointer items-center justify-center rounded-full bg-primary/40 text-foreground backdrop-blur-sm transition-colors hover:bg-primary/60"
              >
                <ScanLine aria-hidden="true" className="size-6" />
              </button>
            }
          />
        </li>
        <li className="flex justify-center">
          <CartLink className={ICON_BUTTON} iconClassName="size-5" />
        </li>
        <li className="flex justify-center">
          <MobileAccountButton className={ICON_BUTTON} />
        </li>
      </ul>
    </nav>
  )
}
