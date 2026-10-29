import { createFileRoute } from '@tanstack/react-router'
import { FavoriteNftsPanel } from '@/features/cart/components/favorite-nfts-panel'

export const Route = createFileRoute('/perfil/favoritos')({
  component: FavoritesPage,
})

function FavoritesPage() {
  const { session } = Route.useRouteContext()
  return <FavoriteNftsPanel key={session.user.id} userId={session.user.id} />
}
