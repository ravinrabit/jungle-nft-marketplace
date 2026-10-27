import { delay, HttpResponse } from 'msw'
import { createSeededRandom, randomInteger } from '@/mocks/lib/deterministic-random'
import { apiError } from '@/mocks/http/responses'
import { getActiveScenario, type LatencyProfile, type MockScenario } from './scenarios'

const LATENCY_SEED = 7_331
const FLAKY_FAILURE_INTERVAL = 3

let requestIndex = 0

export function resetNetworkSequence() {
  requestIndex = 0
}

function resolveLatency(profile: LatencyProfile, index: number) {
  switch (profile.kind) {
    case 'none':
      return 0
    case 'fixed':
      return profile.ms
    case 'range':
      return randomInteger(createSeededRandom(LATENCY_SEED + index), profile.minMs, profile.maxMs)
    case 'alternating':
      return index % 2 === 1 ? profile.slowMs : profile.fastMs
  }
}

function resolveFailure(scenario: MockScenario, index: number) {
  switch (scenario.failure) {
    case 'offline':
      return HttpResponse.error()
    case 'server-error':
      return apiError(503, 'TRANSIENT_FAILURE', 'Serviço temporariamente indisponível.')
    case 'flaky':
      return index % FLAKY_FAILURE_INTERVAL === 1
        ? apiError(503, 'TRANSIENT_FAILURE', 'Serviço temporariamente indisponível.')
        : null
    case 'timeout':
    case 'none':
      return null
  }
}

export async function simulateNetworkConditions() {
  requestIndex += 1
  const index = requestIndex
  const scenario = getActiveScenario()

  if (scenario.failure === 'timeout') {
    await delay('infinite')
  }

  const latency = resolveLatency(scenario.latency, index)
  if (latency > 0) {
    await delay(latency)
  }

  return resolveFailure(scenario, index)
}
