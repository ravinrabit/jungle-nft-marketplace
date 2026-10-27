import { hashPassword } from '@/mocks/lib/password-hash'
import type { UserRecord, WalletRecord } from '../records'
import { CATALOG_REFERENCE_DATE } from './catalog-fixtures'

export const TEST_ACCOUNTS = {
  collector: {
    id: 'user-collector',
    email: 'colecionador@kurio.test',
    password: 'Kurio2026!',
  },
  curator: {
    id: 'user-curator',
    email: 'curadora@kurio.test',
    password: 'Curadora2026!',
  },
} as const

const SEEDED_AT = CATALOG_REFERENCE_DATE.toISOString()

export async function createUserFixtures(): Promise<UserRecord[]> {
  const [collectorHash, curatorHash] = await Promise.all([
    hashPassword(TEST_ACCOUNTS.collector.password),
    hashPassword(TEST_ACCOUNTS.curator.password),
  ])

  return [
    {
      id: TEST_ACCOUNTS.collector.id,
      username: 'colecionador',
      displayName: 'Colecionador Kurio',
      email: TEST_ACCOUNTS.collector.email,
      ensName: 'colecionador',
      walletNickname: 'Cofre principal',
      avatarUrl: null,
      version: 1,
      passwordHash: collectorHash.hash,
      passwordSalt: collectorHash.salt,
    },
    {
      id: TEST_ACCOUNTS.curator.id,
      username: 'curadora',
      displayName: 'Curadora Kurio',
      email: TEST_ACCOUNTS.curator.email,
      ensName: 'curadora',
      walletNickname: 'Acervo',
      avatarUrl: null,
      version: 1,
      passwordHash: curatorHash.hash,
      passwordSalt: curatorHash.salt,
    },
  ]
}

export function createWalletFixtures(): WalletRecord[] {
  return [
    {
      id: 'wallet-collector-primary',
      userId: TEST_ACCOUNTS.collector.id,
      slot: 'primary',
      label: 'Principal',
      nickname: 'Cofre principal',
      network: 'ethereum',
      profileName: 'colecionador',
      address: '0xA91F3c5B8e2D4f6A7b9C0d1E2f3A4b5C6d7EE82C',
      alternateAddress: null,
      provider: 'metamask',
      referralCode: 'KURIO42',
      email: TEST_ACCOUNTS.collector.email,
      ensName: 'colecionador',
      version: 1,
      updatedAt: SEEDED_AT,
    },
    {
      id: 'wallet-collector-secondary',
      userId: TEST_ACCOUNTS.collector.id,
      slot: 'secondary',
      label: 'Reserva',
      nickname: 'Reserva',
      network: 'polygon',
      profileName: 'colecionador',
      address: '0x5D2e8F1a3B4c6D7e9F0a1B2c3D4e5F6a7B8c9D0E',
      alternateAddress: 'nova.kurio.eth',
      provider: 'coinbase',
      referralCode: 'KURIO42',
      email: TEST_ACCOUNTS.collector.email,
      ensName: 'colecionador',
      version: 1,
      updatedAt: SEEDED_AT,
    },
    {
      id: 'wallet-curator-primary',
      userId: TEST_ACCOUNTS.curator.id,
      slot: 'primary',
      label: 'Acervo',
      nickname: 'Acervo',
      network: 'ethereum',
      profileName: 'curadora',
      address: '0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2D',
      alternateAddress: null,
      provider: 'walletconnect',
      referralCode: 'CURA2026',
      email: TEST_ACCOUNTS.curator.email,
      ensName: 'curadora',
      version: 1,
      updatedAt: SEEDED_AT,
    },
  ]
}
