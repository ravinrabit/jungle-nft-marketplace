import type { User, Wallet } from '@/shared/api/contracts/account'
import type { EditionKind, NftDetail } from '@/shared/api/contracts/catalog'
import type {
  CollectorDetails,
  Order,
  Quote,
  WalletConnection,
} from '@/shared/api/contracts/commerce'

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

export interface SessionRecord {
  token: string
  userId: string
  createdAt: string
  expiresAt: string
}

export type CartOwner = { kind: 'user'; userId: string } | { kind: 'guest'; guestId: string }

export interface CartItemRecord {
  id: string
  nftId: string
  editionKind: EditionKind
  quantity: number
  addedUnitPrice: string
}

export interface CartRecord {
  id: string
  owner: CartOwner
  items: CartItemRecord[]
  version: number
  updatedAt: string
}

export interface FavoritesRecord {
  userId: string
  nftIds: string[]
}

export interface QuoteRecord extends Quote {
  ownerKey: string
}

export interface WalletConnectionRecord extends WalletConnection {
  userId: string
  disconnectedAt: string | null
}

export type OrderOutcome = 'confirm' | 'decline'

export interface OrderRecord extends Order {
  userId: string
  idempotencyKey: string
  requestFingerprint: string
  collector: CollectorDetails
  connectionId: string
  outcome: OrderOutcome
  resolveAt: string
}

export interface MockDatabaseState {
  schemaVersion: number
  nfts: NftRecord[]
  users: UserRecord[]
  wallets: WalletRecord[]
  sessions: SessionRecord[]
  carts: CartRecord[]
  favorites: FavoritesRecord[]
  quotes: QuoteRecord[]
  walletConnections: WalletConnectionRecord[]
  orders: OrderRecord[]
}
