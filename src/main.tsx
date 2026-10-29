import '@fontsource/roboto-mono/latin-400.css'
import '@fontsource/roboto-mono/latin-500.css'
import '@fontsource/roboto-mono/latin-700.css'
import '@/styles/globals.css'

const mockEnvironment =
  import.meta.env.VITE_API_MOCKING === 'disabled' ? null : import('@/mocks/browser')

void import('@/app/start-app').then(({ startApp }) => startApp(mockEnvironment))
