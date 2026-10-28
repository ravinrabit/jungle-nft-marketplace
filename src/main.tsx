import '@fontsource/roboto-mono/latin-400.css'
import '@fontsource/roboto-mono/latin-500.css'
import '@fontsource/roboto-mono/latin-700.css'
import '@/styles/globals.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrapMocks } from '@/app/bootstrap-mocks'
import { createQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'
import { StartupErrorScreen } from '@/app/startup-error-screen'
import { expireSession } from '@/features/auth/session-expiration'
import { sessionToken } from '@/features/auth/session-token'
import { bindAuthentication } from '@/shared/api/http-client'

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

  bindAuthentication({
    getToken: () => sessionToken.read(),
    onSessionRejected: () => {
      expireSession(queryClient, router)
    },
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

async function start() {
  const root = createRoot(getRootElement())

  try {
    await bootstrapMocks()
  } catch (error) {
    console.error('Falha ao iniciar os mocks de rede', error)
    renderStartupError(root)
    return
  }

  renderApp(root)
}

void start()
