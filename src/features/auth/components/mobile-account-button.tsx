import { LogOut, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'
import { useSession } from '../api/auth-queries'
import { useAuthNavigation } from '../use-auth-navigation'
import { useSignOut } from '../use-sign-out'
import { UserAvatar } from './user-avatar'

interface MobileAccountButtonProps {
  className: string
}

export function MobileAccountButton({ className }: MobileAccountButtonProps) {
  const { user } = useSession()
  const { openAuth } = useAuthNavigation()
  const { signOut, isSigningOut } = useSignOut()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) {
    return (
      <button
        type="button"
        aria-label="Entrar na conta"
        className={className}
        onClick={() => {
          openAuth('entrar')
        }}
      >
        <UserIcon aria-hidden="true" className="size-5" />
      </button>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Conta de ${user.displayName}`}
          className={cn(className, 'text-text-accent')}
        >
          <UserAvatar user={user} className="size-6 rounded-full" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-[1.75rem] border-border bg-surface-card pb-10"
      >
        <SheetHeader>
          <SheetTitle>{user.displayName}</SheetTitle>
          <SheetDescription className="text-text-secondary">{user.email}</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <button
            type="button"
            disabled={isSigningOut}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[0.625rem] border border-primary text-base font-medium text-text-accent disabled:opacity-60"
            onClick={() => {
              setIsOpen(false)
              signOut()
            }}
          >
            <LogOut aria-hidden="true" className="size-4" />
            Sair
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
