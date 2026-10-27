import { setupWorker } from 'msw/browser'
import { applyUrlControls, exposeMockControls } from './controls'
import { database } from './db/database'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMockEnvironment() {
  await database.initialize()
  await applyUrlControls()
  exposeMockControls()

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
}
