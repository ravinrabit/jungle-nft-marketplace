import { createFileRoute } from '@tanstack/react-router'
import { WalletsPanel } from '@/features/account/components/wallets-panel'

export const Route = createFileRoute('/perfil/carteiras')({
  component: WalletsPage,
})

function WalletsPage() {
  const { session } = Route.useRouteContext()
  return <WalletsPanel key={session.user.id} userId={session.user.id} />
}
