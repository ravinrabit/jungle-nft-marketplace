import type { NetworkId } from '@/shared/api/contracts/catalog'

export type CouponRule = { kind: 'percent'; percent: string } | { kind: 'fixed'; amount: string }

export interface CouponFixture {
  code: string
  description: string
  rule: CouponRule
  expiresAt: string | null
}

export const COUPON_FIXTURES: readonly CouponFixture[] = [
  {
    code: 'KURIO10',
    description: '10% de desconto no lançamento',
    rule: { kind: 'percent', percent: '0.1' },
    expiresAt: null,
  },
  {
    code: 'GENESIS',
    description: '0.05 ETH de desconto em lançamentos gênesis',
    rule: { kind: 'fixed', amount: '0.05' },
    expiresAt: null,
  },
  {
    code: 'EXPIRADO',
    description: 'Cupom de lançamento encerrado',
    rule: { kind: 'percent', percent: '0.2' },
    expiresAt: '2026-01-01T00:00:00.000Z',
  },
]

export const NETWORK_FEES: Record<NetworkId, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.0005',
}

export const DEFAULT_QUOTE_NETWORK: NetworkId = 'ethereum'
export const QUOTE_TTL_MS = 10 * 60_000
