export const ACCOUNTS = {
  collector: {
    email: 'colecionador@kurio.test',
    password: 'Kurio2026!',
    displayName: 'Colecionador Kurio',
  },
  curator: {
    email: 'curadora@kurio.test',
    password: 'Curadora2026!',
    displayName: 'Curadora Kurio',
  },
} as const

export interface TestAccount {
  email: string
  password: string
  displayName: string
}

export const NFTS = {
  emeraldApe: { slug: 'emerald-ape-042', name: 'Emerald Ape #042', price: '1.19 ETH' },
  goldenBeat: { slug: 'golden-beat-207', name: 'Golden Beat #207', price: '0.99 ETH' },
  ivoryBaron: { slug: 'ivory-baron-088', name: 'Ivory Baron #088' },
  sageNomad: { slug: 'sage-nomad-009', name: 'Sage Nomad #009' },
} as const

export type MockScenarioId =
  | 'default'
  | 'instant'
  | 'slow'
  | 'variable-latency'
  | 'out-of-order'
  | 'empty-catalog'
  | 'offline'
  | 'server-error'
  | 'flaky'
  | 'timeout'
  | 'short-session'
  | 'favorites-error'
  | 'wallet-rejected'
  | 'payment-declined'
  | 'order-timeout'
  | 'price-change-checkout'
  | 'realtime-chaos'
  | 'realtime-offline'

export type EditionKind = '1-1' | '1-10' | '1-50' | 'open'

export interface MockControls {
  setScenario: (id: MockScenarioId) => void
  expireSessions: () => void
  disconnectWallets: () => void
  disconnectRealtime: () => void
  setEditionPrice: (nftId: string, editionKind: EditionKind, price: string) => boolean
  setEditionAvailability: (nftId: string, editionKind: EditionKind, available: number) => boolean
}

declare global {
  interface Window {
    __kurioMocks?: MockControls
  }
}
