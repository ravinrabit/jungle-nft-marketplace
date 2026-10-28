import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/require-session'
import { AccountSidebar } from '@/features/account/components/account-sidebar'

export const Route = createFileRoute('/perfil')({
  beforeLoad: requireSession,
  component: AccountLayout,
})

function AccountLayout() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-7">
      <AccountSidebar />
      <Outlet />
    </div>
  )
}
