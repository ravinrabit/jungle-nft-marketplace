import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { WalletsPanel } from '@/features/account/components/wallets-panel'

const walletsSearchSchema = z.object({
  retorno: z.enum(['pagamento']).optional().catch(undefined),
})

export const Route = createFileRoute('/perfil/carteiras')({
  validateSearch: walletsSearchSchema,
  component: WalletsPage,
})

function WalletsPage() {
  const { session } = Route.useRouteContext()
  const { retorno } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      {retorno === 'pagamento' && (
        <p
          role="status"
          className="rounded-md border border-primary/50 bg-primary/10 px-4 py-3 text-sm leading-5 text-foreground"
        >
          Salve uma carteira para voltar automaticamente ao pagamento.
        </p>
      )}
      <WalletsPanel
        key={session.user.id}
        userId={session.user.id}
        onWalletSaved={
          retorno === 'pagamento' ? () => void navigate({ to: '/pagamento' }) : undefined
        }
      />
    </div>
  )
}
