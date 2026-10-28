import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export function MarketBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Trilha de navegação" className="hidden lg:block">
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
        <li aria-hidden="true">/</li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  )
}

export function MobilePageHeader({ title }: { title: string }) {
  const router = useRouter()
  return (
    <header className="relative flex h-11 items-center justify-center lg:h-auto lg:justify-start">
      <button
        type="button"
        aria-label="Voltar"
        className="absolute left-0 flex size-[2.1875rem] cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-text-secondary lg:hidden"
        onClick={() => {
          router.history.back()
        }}
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </button>
      <h1 className="text-xl leading-4 font-bold text-foreground lg:sr-only">{title}</h1>
    </header>
  )
}
