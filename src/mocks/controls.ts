import type { EditionKind } from '@/shared/api/contracts/catalog'
import { database } from './db/database'
import { disconnectAllWallets } from './domain/orders'
import { expireAllSessions } from './domain/sessions'
import { resetNetworkSequence } from './network/network-conditions'
import { updateEditionAvailability, updateEditionPrice } from './realtime/market-events'
import { disconnectAllSubscribers } from './realtime/realtime-hub'
import {
  isMockScenarioId,
  MOCK_SCENARIOS,
  readActiveScenarioId,
  storeActiveScenarioId,
  type MockScenarioId,
} from './network/scenarios'

export const SCENARIO_URL_PARAM = 'mock-scenario'
export const RESET_URL_PARAM = 'mock-reset'

export interface MockControls {
  scenarios: readonly { id: MockScenarioId; label: string; description: string }[]
  getScenario: () => MockScenarioId
  setScenario: (id: MockScenarioId) => void
  reset: () => Promise<void>
  expireSessions: () => void
  disconnectWallets: () => void
  setEditionPrice: (nftId: string, editionKind: EditionKind, price: string) => boolean
  setEditionAvailability: (nftId: string, editionKind: EditionKind, available: number) => boolean
  disconnectRealtime: () => void
}

declare global {
  interface Window {
    __kurioMocks?: MockControls
  }
}

export async function resetMockEnvironment() {
  await database.reset()
  resetNetworkSequence()
}

function stripControlParams(url: URL) {
  url.searchParams.delete(SCENARIO_URL_PARAM)
  url.searchParams.delete(RESET_URL_PARAM)
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export async function applyUrlControls() {
  const url = new URL(window.location.href)
  const requestedScenario = url.searchParams.get(SCENARIO_URL_PARAM)
  const shouldReset = url.searchParams.has(RESET_URL_PARAM)

  if (requestedScenario && isMockScenarioId(requestedScenario)) {
    storeActiveScenarioId(requestedScenario)
  }

  if (shouldReset) {
    await resetMockEnvironment()
  }

  if (requestedScenario !== null || shouldReset) {
    stripControlParams(url)
  }
}

export function exposeMockControls() {
  window.__kurioMocks = {
    scenarios: MOCK_SCENARIOS.map(({ id, label, description }) => ({ id, label, description })),
    getScenario: readActiveScenarioId,
    setScenario: (id) => {
      storeActiveScenarioId(id)
      resetNetworkSequence()
    },
    reset: resetMockEnvironment,
    expireSessions: expireAllSessions,
    disconnectWallets: disconnectAllWallets,
    setEditionPrice: updateEditionPrice,
    setEditionAvailability: updateEditionAvailability,
    disconnectRealtime: disconnectAllSubscribers,
  }
}
