export type LatencyProfile =
  | { kind: 'none' }
  | { kind: 'fixed'; ms: number }
  | { kind: 'range'; minMs: number; maxMs: number }
  | { kind: 'alternating'; slowMs: number; fastMs: number }

export type FailureMode = 'none' | 'offline' | 'server-error' | 'timeout' | 'flaky'

export type CatalogDataset = 'default' | 'empty'

export interface MockScenario {
  id: string
  label: string
  description: string
  latency: LatencyProfile
  failure: FailureMode
  catalog: CatalogDataset
  sessionTtlMs?: number
  failFavorites?: boolean
}

export const DEFAULT_SESSION_TTL_MS = 30 * 60_000

const DEFAULT_LATENCY: LatencyProfile = { kind: 'range', minMs: 120, maxMs: 420 }

export const MOCK_SCENARIOS = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'Respostas bem-sucedidas com latência curta e determinística.',
    latency: DEFAULT_LATENCY,
    failure: 'none',
    catalog: 'default',
  },
  {
    id: 'instant',
    label: 'Instantâneo',
    description: 'Sem latência, usado na regressão visual e em testes determinísticos.',
    latency: { kind: 'none' },
    failure: 'none',
    catalog: 'default',
  },
  {
    id: 'slow',
    label: 'Rede lenta',
    description: 'Todas as respostas demoram 2,5 segundos para exibir os skeletons.',
    latency: { kind: 'fixed', ms: 2_500 },
    failure: 'none',
    catalog: 'default',
  },
  {
    id: 'variable-latency',
    label: 'Latência variável',
    description: 'Latência entre 200 ms e 2,2 s, sorteada de forma reproduzível.',
    latency: { kind: 'range', minMs: 200, maxMs: 2_200 },
    failure: 'none',
    catalog: 'default',
  },
  {
    id: 'out-of-order',
    label: 'Respostas fora de ordem',
    description:
      'Requisições ímpares demoram 1,8 s e as pares 200 ms, invertendo a ordem de chegada.',
    latency: { kind: 'alternating', slowMs: 1_800, fastMs: 200 },
    failure: 'none',
    catalog: 'default',
  },
  {
    id: 'empty-catalog',
    label: 'Catálogo vazio',
    description: 'O catálogo não retorna nenhum NFT.',
    latency: DEFAULT_LATENCY,
    failure: 'none',
    catalog: 'empty',
  },
  {
    id: 'offline',
    label: 'Sem conexão',
    description: 'Toda requisição falha como se a rede estivesse indisponível.',
    latency: DEFAULT_LATENCY,
    failure: 'offline',
    catalog: 'default',
  },
  {
    id: 'server-error',
    label: 'Erro no servidor',
    description: 'Toda requisição responde 503 com falha transitória.',
    latency: DEFAULT_LATENCY,
    failure: 'server-error',
    catalog: 'default',
  },
  {
    id: 'flaky',
    label: 'Instável',
    description: 'A primeira de cada três requisições responde 503; as seguintes funcionam.',
    latency: DEFAULT_LATENCY,
    failure: 'flaky',
    catalog: 'default',
  },
  {
    id: 'timeout',
    label: 'Timeout',
    description: 'O servidor nunca responde, e o cliente encerra a requisição pelo timeout.',
    latency: { kind: 'none' },
    failure: 'timeout',
    catalog: 'default',
  },
  {
    id: 'short-session',
    label: 'Sessão curta',
    description:
      'Sessões novas expiram em 45 segundos para exercitar a expiração durante a navegação.',
    latency: DEFAULT_LATENCY,
    failure: 'none',
    catalog: 'default',
    sessionTtlMs: 45_000,
  },
  {
    id: 'favorites-error',
    label: 'Falha nos favoritos',
    description:
      'Adicionar ou remover favoritos responde 503, para exercitar a reversão da atualização otimista.',
    latency: DEFAULT_LATENCY,
    failure: 'none',
    catalog: 'default',
    failFavorites: true,
  },
] as const satisfies readonly MockScenario[]

export type MockScenarioId = (typeof MOCK_SCENARIOS)[number]['id']

export const DEFAULT_SCENARIO_ID: MockScenarioId = 'default'

const SCENARIO_STORAGE_KEY = 'kurio:mock-scenario'

export function isMockScenarioId(value: string): value is MockScenarioId {
  return MOCK_SCENARIOS.some((scenario) => scenario.id === value)
}

export function findScenario(id: MockScenarioId): MockScenario {
  return MOCK_SCENARIOS.find((scenario) => scenario.id === id) ?? MOCK_SCENARIOS[0]
}

export function readActiveScenarioId(): MockScenarioId {
  try {
    const stored = localStorage.getItem(SCENARIO_STORAGE_KEY)
    return stored && isMockScenarioId(stored) ? stored : DEFAULT_SCENARIO_ID
  } catch {
    return DEFAULT_SCENARIO_ID
  }
}

export function getActiveScenario() {
  return findScenario(readActiveScenarioId())
}

export function storeActiveScenarioId(id: MockScenarioId) {
  try {
    localStorage.setItem(SCENARIO_STORAGE_KEY, id)
  } catch (error) {
    console.warn('Não foi possível salvar o cenário simulado', error)
  }
}
