import { ChevronDown, LogOut } from 'lucide-react'
import type { User } from '@/shared/api/contracts/account'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useSignOut } from '../use-sign-out'
import { UserAvatar } from './user-avatar'

export function UserMenu({ user }: { user: User }) {
  const { signOut, isSigningOut } = useSignOut()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu da conta de ${user.displayName}`}
        className="flex h-[2.1875rem] max-w-[11rem] cursor-pointer items-center gap-2 rounded-md border border-primary px-2 text-sm leading-none font-medium text-foreground transition-colors hover:bg-surface-raised"
      >
        <UserAvatar user={user} className="size-6 shrink-0 rounded-full" />
        <span className="truncate">{user.displayName}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-border bg-surface-card">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate text-sm font-bold text-foreground">{user.displayName}</span>
          <span className="truncate text-xs font-normal text-text-secondary">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          disabled={isSigningOut}
          className="cursor-pointer text-foreground focus:bg-surface-raised focus:text-text-accent"
          onSelect={signOut}
        >
          <LogOut aria-hidden="true" className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
