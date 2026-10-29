import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'
import { StartupErrorScreen } from '@/app/startup-error-screen'
import { expireSession } from '@/features/auth/session-expiration'
import { sessionToken } from '@/features/auth/session-token'
import { registerGuestCartMerge } from '@/features/cart/merge-guest-cart-on-login'
import { registerCheckoutCleanup } from '@/features/checkout/checkout-storage'
import { startRealtimeSync } from '@/features/realtime/start-realtime-sync'
import { bindAuthentication } from '@/shared/api/http-client'

interface MockEnvironmentModule {
  startMockEnvironment: () => Promise<unknown>
}

function getRootElement() {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Elemento #root não encontrado no index.html')
  }
  return rootElement
}

function renderApp(root: ReturnType<typeof createRoot>) {
  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient)

  registerGuestCartMerge()
  registerCheckoutCleanup()

  bindAuthentication({
    getToken: () => sessionToken.read(),
    onSessionRejected: () => {
      expireSession(queryClient, router)
    },
  })

  startRealtimeSync({
    queryClient,
    openOrder: (orderId) => {
      void router.navigate({ to: '/pedidos/$orderId', params: { orderId } })
    },
  }).catch((error: unknown) => {
    console.error('Falha ao iniciar as atualizações em tempo real', error)
  })

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

function renderStartupError(root: ReturnType<typeof createRoot>) {
  root.render(
    <StrictMode>
      <StartupErrorScreen
        onRetry={() => {
          window.location.reload()
        }}
      />
    </StrictMode>,
  )
}

export async function startApp(mockEnvironment: Promise<MockEnvironmentModule> | null) {
  const root = createRoot(getRootElement())

  try {
    if (mockEnvironment) {
      const { startMockEnvironment } = await mockEnvironment
      await startMockEnvironment()
    }
  } catch (error) {
    console.error('Falha ao iniciar os mocks de rede', error)
    renderStartupError(root)
    return
  }

  renderApp(root)
}
