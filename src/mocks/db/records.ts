import type { User, Wallet } from '@/shared/api/contracts/account'
import type { NftDetail } from '@/shared/api/contracts/catalog'

export interface NftRecord extends NftDetail {
  trendingScore: number
}

export interface UserRecord extends User {
  passwordHash: string
  passwordSalt: string
}

export interface WalletRecord extends Wallet {
  userId: string
}

export interface MockDatabaseState {
  schemaVersion: number
  nfts: NftRecord[]
  users: UserRecord[]
  wallets: WalletRecord[]
}
