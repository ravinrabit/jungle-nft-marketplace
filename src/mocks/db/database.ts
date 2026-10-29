import { createCatalogFixtures } from './fixtures/catalog-fixtures'
import { createUserFixtures, createWalletFixtures } from './fixtures/user-fixtures'
import type { MockDatabaseState } from './records'

const STORAGE_KEY = 'kurio:mock-db'
const SCHEMA_VERSION = 7

async function createSeedState(): Promise<MockDatabaseState> {
  return {
    schemaVersion: SCHEMA_VERSION,
    nfts: createCatalogFixtures(),
    users: await createUserFixtures(),
    wallets: createWalletFixtures(),
    sessions: [],
    carts: [],
    favorites: [],
    quotes: [],
    walletConnections: [],
    orders: [],
    newsletterSubscriptions: [],
  }
}

function isCompatibleState(value: unknown): value is MockDatabaseState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === SCHEMA_VERSION
  )
}

function readPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    return isCompatibleState(parsed) ? parsed : null
  } catch {
    return null
  }
}

function persistState(state: MockDatabaseState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Não foi possível persistir o banco simulado', error)
  }
}

class MockDatabase {
  #state: MockDatabaseState | null = null

  async initialize() {
    this.#state = readPersistedState() ?? (await createSeedState())
    persistState(this.#state)
  }

  async reset() {
    this.#state = await createSeedState()
    persistState(this.#state)
  }

  read<TResult>(select: (state: Readonly<MockDatabaseState>) => TResult): TResult {
    return select(this.#requireState())
  }

  write<TResult>(mutate: (state: MockDatabaseState) => TResult): TResult {
    const state = this.#requireState()
    const result = mutate(state)
    persistState(state)
    return result
  }

  #requireState() {
    if (!this.#state) {
      throw new Error('O banco simulado ainda não foi inicializado')
    }
    return this.#state
  }
}

export const database = new MockDatabase()
