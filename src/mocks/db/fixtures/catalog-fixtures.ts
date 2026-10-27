import {
  CATEGORY_IDS,
  type ArtworkSlug,
  type CategoryId,
  type Edition,
  type EditionKind,
  type NetworkId,
  type Rarity,
} from '@/shared/api/contracts/catalog'
import { multiplyEth, roundEth } from '@/shared/lib/eth'
import {
  createSeededRandom,
  randomHex,
  randomInteger,
  type RandomSource,
} from '@/mocks/lib/deterministic-random'
import { slugify } from '@/mocks/lib/text'
import type { NftRecord } from '../records'

export const CATALOG_REFERENCE_DATE = new Date(Date.UTC(2026, 9, 1, 12, 0, 0))
export const NEW_RELEASE_WINDOW_DAYS = 14
export const TRENDING_SCORE_THRESHOLD = 70

const CATALOG_SEED = 20_261_001
const GENERATED_NFT_COUNT = 30
const DAY_IN_MS = 86_400_000

interface ArtworkProfile {
  imageAlt: string
  collectionName: string
  creatorName: string
  attributes: readonly string[]
  nouns: readonly string[]
}

const ARTWORK_PROFILES: Record<ArtworkSlug, ArtworkProfile> = {
  'emerald-ape': {
    imageAlt:
      'Macaco de pelo castanho com óculos redondos de lentes verdes, jaqueta universitária verde e colar com pingente de esmeralda',
    collectionName: 'Kurio Apes',
    creatorName: 'Nova Sato',
    attributes: ['Óculos', 'Esmeralda', 'Jaqueta universitária'],
    nouns: ['Ape', 'Drifter', 'Varsity'],
  },
  'sage-nomad': {
    imageAlt: 'Gorila de pelo cinza com chapéu bucket verde-oliva e moletom roxo com capuz',
    collectionName: 'Sage Collective',
    creatorName: 'Iris Moreau',
    attributes: ['Chapéu bucket', 'Moletom', 'Lavanda'],
    nouns: ['Nomad', 'Bloom', 'Wanderer'],
  },
  'ivory-baron': {
    imageAlt: 'Chimpanzé de pelo preto com brinco dourado, blusa de gola alta verde e blazer bege',
    collectionName: 'Ivory Society',
    creatorName: 'Theo Lindqvist',
    attributes: ['Blazer', 'Gola alta', 'Brinco dourado'],
    nouns: ['Baron', 'Vessel', 'Monarch'],
  },
  'golden-beat': {
    imageAlt: 'Orangotango de pelo dourado com fones de ouvido verdes e jaqueta bomber creme',
    collectionName: 'Golden Frequencies',
    creatorName: 'Maya Okafor',
    attributes: ['Fones de ouvido', 'Bomber', 'Dourado'],
    nouns: ['Beat', 'Signal', 'Rhythm'],
  },
}

const ADJECTIVES = [
  'Amber',
  'Velvet',
  'Copper',
  'Lunar',
  'Jade',
  'Solar',
  'Crimson',
  'Silver',
  'Obsidian',
  'Coral',
  'Onyx',
  'Saffron',
] as const

const ARTWORK_ORDER: readonly ArtworkSlug[] = [
  'emerald-ape',
  'sage-nomad',
  'ivory-baron',
  'golden-beat',
]

const NETWORK_LABELS: Record<NetworkId, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

const EDITION_LABELS: Record<EditionKind, string> = {
  '1-1': '1/1',
  '1-10': '1/10',
  '1-50': '1/50',
  open: 'aberta',
}

interface CuratedNft {
  name: string
  artwork: ArtworkSlug
  price: string
  compareAtPrice: string | null
  category: CategoryId
  network: NetworkId
  rarity: Rarity
  trendingScore: number
  listedDaysAgo: number
}

const CURATED_NFTS: readonly CuratedNft[] = [
  {
    name: 'Emerald Ape #042',
    artwork: 'emerald-ape',
    price: '1.19',
    compareAtPrice: null,
    category: 'digital-art',
    network: 'ethereum',
    rarity: 'rare',
    trendingScore: 96,
    listedDaysAgo: 1,
  },
  {
    name: 'Sage Nomad #009',
    artwork: 'sage-nomad',
    price: '1.69',
    compareAtPrice: null,
    category: 'digital-art',
    network: 'ethereum',
    rarity: 'common',
    trendingScore: 88,
    listedDaysAgo: 2,
  },
  {
    name: 'Neon Vessel #552',
    artwork: 'ivory-baron',
    price: '1.99',
    compareAtPrice: '2.29',
    category: 'collectibles',
    network: 'polygon',
    rarity: 'rare',
    trendingScore: 91,
    listedDaysAgo: 3,
  },
  {
    name: 'Cosmic Bloom #118',
    artwork: 'sage-nomad',
    price: '1.29',
    compareAtPrice: null,
    category: 'generative',
    network: 'ethereum',
    rarity: 'common',
    trendingScore: 64,
    listedDaysAgo: 4,
  },
  {
    name: 'Violet Nomad #314',
    artwork: 'sage-nomad',
    price: '1.39',
    compareAtPrice: null,
    category: 'photography',
    network: 'solana',
    rarity: 'common',
    trendingScore: 58,
    listedDaysAgo: 6,
  },
  {
    name: 'Ivory Baron #088',
    artwork: 'ivory-baron',
    price: '1.79',
    compareAtPrice: null,
    category: 'collectibles',
    network: 'ethereum',
    rarity: 'legendary',
    trendingScore: 82,
    listedDaysAgo: 8,
  },
  {
    name: 'Golden Beat #207',
    artwork: 'golden-beat',
    price: '0.99',
    compareAtPrice: null,
    category: 'music',
    network: 'polygon',
    rarity: 'common',
    trendingScore: 77,
    listedDaysAgo: 10,
  },
  {
    name: 'Golden Signal #160',
    artwork: 'golden-beat',
    price: '0.39',
    compareAtPrice: null,
    category: 'music',
    network: 'solana',
    rarity: 'common',
    trendingScore: 45,
    listedDaysAgo: 12,
  },
]

const EXTREME_PRICES = ['0.02', '12.30'] as const

function buildEditions(basePrice: string, random: RandomSource, isSoldOut: boolean): Edition[] {
  const availableOrZero = (amount: number) => (isSoldOut ? 0 : amount)

  return [
    {
      kind: '1-1',
      supply: 1,
      available: availableOrZero(random() < 0.3 ? 0 : 1),
      maxPerOrder: 1,
      price: roundEth(multiplyEth(basePrice, 4), 3),
    },
    {
      kind: '1-10',
      supply: 10,
      available: availableOrZero(randomInteger(random, 0, 10)),
      maxPerOrder: 3,
      price: roundEth(multiplyEth(basePrice, '1.8'), 3),
    },
    {
      kind: '1-50',
      supply: 50,
      available: availableOrZero(randomInteger(random, 4, 50)),
      maxPerOrder: 10,
      price: basePrice,
    },
    {
      kind: 'open',
      supply: null,
      available: availableOrZero(999),
      maxPerOrder: 20,
      price: roundEth(multiplyEth(basePrice, '0.6'), 3),
    },
  ]
}

function buildStory(name: string, profile: ArtworkProfile, network: NetworkId) {
  return [
    `${name} é uma obra digital 1/50 finalizada à mão da coleção ${profile.collectionName}. Cada atributo fica armazenado nos metadados do token e verificado na ${NETWORK_LABELS[network]}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
    `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${profile.creatorName} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
  ]
}

function buildRecord(entry: CuratedNft, random: RandomSource, index: number): NftRecord {
  const profile = ARTWORK_PROFILES[entry.artwork]
  const isSoldOut = index % 11 === 10
  const editions = buildEditions(entry.price, random, isSoldOut)
  const listedAt = new Date(CATALOG_REFERENCE_DATE.getTime() - entry.listedDaysAgo * DAY_IN_MS)
  const tokenNumber = entry.name.split('#')[1] ?? String(index)
  const rarityAttribute =
    entry.rarity === 'common' ? [] : [entry.rarity === 'rare' ? 'Raro' : 'Lendário']

  return {
    id: slugify(entry.name),
    tokenId: `#${tokenNumber.padStart(4, '0')}`,
    name: entry.name,
    artwork: entry.artwork,
    imageAlt: `${entry.name}: ${profile.imageAlt}`,
    category: entry.category,
    network: entry.network,
    rarity: entry.rarity,
    price: entry.price,
    compareAtPrice: entry.compareAtPrice,
    isAvailable: editions.some((edition) => edition.available > 0),
    version: 1,
    description: `Um colecionável digital ${EDITION_LABELS['1-50']} finalizado à mão da coleção ${profile.collectionName}, verificado na ${NETWORK_LABELS[entry.network]}, com arte desbloqueável e acesso para colecionadores.`,
    story: buildStory(entry.name, profile, entry.network),
    collectionName: profile.collectionName,
    creatorName: profile.creatorName,
    attributes: [...profile.attributes, ...rarityAttribute],
    gallery: [entry.artwork, entry.artwork, entry.artwork, entry.artwork],
    rating: {
      average: (4 + random()).toFixed(1),
      count: randomInteger(random, 3, 60),
    },
    royaltyPercent: 5,
    contractAddress: `0x${randomHex(random, 40)}`,
    defaultEdition: '1-50',
    editions,
    listedAt: listedAt.toISOString(),
    updatedAt: listedAt.toISOString(),
    trendingScore: entry.trendingScore,
  }
}

function pickGeneratedPrice(random: RandomSource, index: number) {
  const extreme = EXTREME_PRICES[index]
  if (extreme) {
    return extreme
  }
  return (0.05 + random() * 9.95).toFixed(2)
}

function pickNetwork(index: number): NetworkId {
  const slot = index % 5
  if (slot === 3) {
    return 'polygon'
  }
  if (slot === 4) {
    return 'solana'
  }
  return 'ethereum'
}

function pickRarity(random: RandomSource): Rarity {
  const roll = random()
  if (roll > 0.94) {
    return 'legendary'
  }
  return roll > 0.75 ? 'rare' : 'common'
}

function generateEntries(random: RandomSource): CuratedNft[] {
  return Array.from({ length: GENERATED_NFT_COUNT }, (_, index) => {
    const artwork = ARTWORK_ORDER[index % ARTWORK_ORDER.length] ?? 'emerald-ape'
    const profile = ARTWORK_PROFILES[artwork]
    const adjective = ADJECTIVES[(index * 5) % ADJECTIVES.length] ?? 'Amber'
    const noun = profile.nouns[index % profile.nouns.length] ?? 'Ape'
    const number = String(randomInteger(random, 100, 999))
    const price = pickGeneratedPrice(random, index)
    const hasDiscount = index % 6 === 5

    return {
      name: `${adjective} ${noun} #${number}`,
      artwork,
      price,
      compareAtPrice: hasDiscount ? roundEth(multiplyEth(price, '1.15'), 2) : null,
      category: CATEGORY_IDS[index % CATEGORY_IDS.length] ?? 'digital-art',
      network: pickNetwork(index),
      rarity: pickRarity(random),
      trendingScore: randomInteger(random, 10, 99),
      listedDaysAgo: 14 + index * 2,
    }
  })
}

function withUniqueIds(records: NftRecord[]) {
  const seen = new Set<string>()
  return records.map((record, index) => {
    const id = seen.has(record.id) ? `${record.id}-${index}` : record.id
    seen.add(id)
    return { ...record, id }
  })
}

export function createCatalogFixtures(): NftRecord[] {
  const random = createSeededRandom(CATALOG_SEED)
  const entries = [...CURATED_NFTS, ...generateEntries(random)]
  return withUniqueIds(entries.map((entry, index) => buildRecord(entry, random, index)))
}
