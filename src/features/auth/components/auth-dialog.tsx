import { useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'
import { useSession } from '../api/auth-queries'
import type { AuthMode } from '../auth-search'
import { useAuthNavigation } from '../use-auth-navigation'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { SocialSignIn } from './social-sign-in'

const DESCRIPTIONS: Record<AuthMode, string> = {
  entrar: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  cadastro: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
}

const MOBILE_TITLES: Record<AuthMode, string> = {
  entrar: 'Entrar',
  cadastro: 'Criar perfil de colecionador',
}

const MODE_LABELS: Record<AuthMode, string> = {
  entrar: 'Entrar',
  cadastro: 'Criar conta',
}

function ModeSwitcher({ mode, onSwitch }: { mode: AuthMode; onSwitch: (mode: AuthMode) => void }) {
  return (
    <div className="hidden items-center justify-center gap-2 lg:flex">
      {(['entrar', 'cadastro'] as const).map((option, index) => (
        <div key={option} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true" className="h-5 w-px bg-text-coral" />}
          <button
            type="button"
            aria-pressed={mode === option}
            onClick={() => {
              onSwitch(option)
            }}
            className={cn(
              'cursor-pointer text-xl leading-4 font-medium transition-colors hover:text-text-accent',
              mode === option ? 'text-text-accent' : 'text-foreground',
            )}
          >
            {MODE_LABELS[option]}
          </button>
        </div>
      ))}
    </div>
  )
}

export function AuthDialog() {
  const { auth: mode, redirect } = useSearch({ from: '__root__' })
  const { openAuth, closeAuth, completeAuth } = useAuthNavigation()
  const { user } = useSession()

  if (!mode) {
    return null
  }

  const handleSuccess = () => {
    toast.success(mode === 'entrar' ? 'Login realizado com sucesso.' : 'Conta criada com sucesso.')
    completeAuth(redirect)
  }

  const switchTo = (next: AuthMode) => {
    openAuth(next, redirect)
  }

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          closeAuth()
        }
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => {
          const firstField =
            event.currentTarget instanceof HTMLElement
              ? event.currentTarget.querySelector('input')
              : null
          if (firstField) {
            event.preventDefault()
            firstField.focus()
          }
        }}
        className={cn(
          'top-0 left-0 block h-dvh w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 bg-ink p-0 sm:max-w-none',
          'lg:top-1/2 lg:left-1/2 lg:h-auto lg:max-h-[95dvh] lg:min-h-[37.5rem] lg:w-[31.25rem] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-none lg:bg-surface-card lg:pb-[3.625rem]',
        )}
      >
        <div className="flex min-h-full flex-col gap-10 px-7 pt-20 pb-6 lg:gap-0 lg:px-0 lg:pt-12 lg:pb-0">
          <p
            aria-hidden="true"
            className="flex h-[8.5rem] items-center justify-center text-[2rem] leading-none font-bold tracking-[0.1em] text-foreground lg:hidden"
          >
            KURIO
          </p>

          <div className="flex flex-col gap-10 lg:px-12">
            <ModeSwitcher mode={mode} onSwitch={switchTo} />
            <DialogTitle className="text-center text-xl leading-4 font-bold text-foreground lg:sr-only">
              {MOBILE_TITLES[mode]}
            </DialogTitle>
            <DialogDescription className="sr-only text-center text-[0.8125rem] leading-4 text-foreground lg:not-sr-only">
              {DESCRIPTIONS[mode]}
            </DialogDescription>
          </div>

          {user && (
            <p role="status" className="text-center text-sm text-text-secondary lg:px-20 lg:pt-6">
              Você está conectado como {user.displayName}. Entrar com outra conta substitui a sessão
              atual.
            </p>
          )}

          {mode === 'entrar' ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}

          <SocialSignIn />

          <p className="text-center text-[0.9375rem] leading-none text-text-secondary lg:hidden">
            {mode === 'entrar' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
            <button
              type="button"
              className="cursor-pointer text-text-accent underline-offset-2 hover:underline"
              onClick={() => {
                switchTo(mode === 'entrar' ? 'cadastro' : 'entrar')
              }}
            >
              {mode === 'entrar' ? 'Crie uma conta' : 'Entrar'}
            </button>
          </p>
        </div>
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 hidden h-2.5 bg-primary lg:block"
        />
      </DialogContent>
    </Dialog>
  )
}
