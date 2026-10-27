import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-sm bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      <main id="conteudo" className="mx-auto w-full max-w-content px-4 md:px-6">
        <Outlet />
      </main>
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
        className="rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary-light"
      >
        Voltar ao início
      </Link>
    </section>
  )
}
