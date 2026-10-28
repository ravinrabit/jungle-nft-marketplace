import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function FormAlert({ message }: { message: string | null }) {
  if (!message) {
    return null
  }
  return (
    <p
      role="alert"
      className="rounded-[0.3125rem] border border-error/60 bg-error/10 px-3 py-2 text-sm leading-5 text-text-coral"
    >
      {message}
    </p>
  )
}

interface AuthSubmitButtonProps {
  isPending: boolean
  pendingLabel: string
  children: ReactNode
}

export function AuthSubmitButton({ isPending, pendingLabel, children }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      aria-busy={isPending}
      className="flex h-[3.75rem] w-full cursor-pointer items-center justify-center gap-2 rounded-[0.625rem] bg-primary text-base leading-4 font-bold text-ink transition-colors hover:bg-primary-light disabled:cursor-wait disabled:opacity-80 lg:h-[2.8125rem] lg:rounded-[0.3125rem]"
    >
      {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
      {isPending ? pendingLabel : children}
    </button>
  )
}
