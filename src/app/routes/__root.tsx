import { createRootRouteWithContext, Link, Outlet, useRouterState } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'
import { MobileTabBar } from '@/app/layout/mobile-tab-bar'
import { SiteFooter } from '@/app/layout/site-footer'
import { SiteHeader } from '@/app/layout/site-header'
import { Toaster } from '@/shared/ui/sonner'
import { authSearchSchema } from '@/features/auth/auth-search'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { SessionWatcher } from '@/features/auth/components/session-watcher'

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: authSearchSchema,
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex min-h-dvh w-full max-w-[75rem] flex-col px-6 pt-10 pb-36 lg:px-6 lg:pt-6 lg:pb-6 xl:px-0">
        <div className="hidden lg:block">
          <SiteHeader showDivider={pathname === '/' || pathname.startsWith('/perfil')} />
        </div>
        <main id="conteudo" tabIndex={-1} className="flex-1 outline-none lg:pt-8">
          <Outlet />
        </main>
        <div className="hidden pt-24 lg:block">
          <SiteFooter />
        </div>
      </div>
      <MobileTabBar />
      <AuthDialog />
      <SessionWatcher />
      <Toaster position="top-center" />
    </>
  )
}

function NotFoundPage() {
  return (
    <section className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="text-text-secondary">O endereço acessado não existe ou foi removido.</p>
      <Link
        to="/"
        className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary-light"
      >
        Voltar ao início
      </Link>
    </section>
  )
}
