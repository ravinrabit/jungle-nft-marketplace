import type { User } from '@/shared/api/contracts/account'
import { cn } from '@/shared/lib/cn'

function initialsOf(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function UserAvatar({ user, className }: { user: User; className: string }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className={cn(className, 'object-cover')} />
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        className,
        'flex items-center justify-center bg-primary text-xs font-bold text-ink',
      )}
    >
      {initialsOf(user.displayName)}
    </span>
  )
}
