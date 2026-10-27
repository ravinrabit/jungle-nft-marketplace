import type {
  CatalogSort,
  CatalogTab,
  CategoryId,
  EditionKind,
  NetworkId,
  Rarity,
} from '@/shared/api/contracts/catalog'

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
}

export const NETWORK_LABELS: Record<NetworkId, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const TAB_LABELS: Record<CatalogTab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

export const SORT_LABELS: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  'name-asc': 'Nome (A-Z)',
}

export const EDITION_LABELS: Record<EditionKind, string> = {
  '1-1': '1/1',
  '1-10': '1/10',
  '1-50': '1/50',
  open: 'Aberta',
}

export const RARITY_LABELS: Record<Rarity, string | null> = {
  common: null,
  rare: 'Raro',
  legendary: 'Lendário',
}

export function byLabel<TId extends string>(labels: Record<TId, string>) {
  return (left: TId, right: TId) => labels[left].localeCompare(labels[right], 'pt-BR')
}
