import { HttpResponse } from 'msw'
import { nftListQuerySchema } from '@/shared/api/contracts/catalog'
import { database } from '@/mocks/db/database'
import { queryCatalog, toNftDetail } from '@/mocks/domain/catalog-query'
import { getActiveScenario } from '@/mocks/network/scenarios'
import { mockApi, readPathParam } from './mock-api'
import { notFound, validationError } from './responses'

function readListQuery(url: URL) {
  const params = url.searchParams
  return {
    q: params.get('q') ?? undefined,
    categories: params.getAll('categories'),
    networks: params.getAll('networks'),
    minPrice: params.get('minPrice') ?? undefined,
    maxPrice: params.get('maxPrice') ?? undefined,
    tab: params.get('tab') ?? undefined,
    sort: params.get('sort') ?? undefined,
    page: params.get('page') ?? undefined,
    pageSize: params.get('pageSize') ?? undefined,
  }
}

export const catalogHandlers = [
  mockApi.get('/nfts', ({ request }) => {
    const query = nftListQuerySchema.safeParse(readListQuery(new URL(request.url)))
    if (!query.success) {
      return validationError(query.error, 'Os filtros do catálogo são inválidos.')
    }

    const records =
      getActiveScenario().catalog === 'empty' ? [] : database.read((state) => state.nfts)

    return HttpResponse.json(queryCatalog(records, query.data))
  }),

  mockApi.get('/nfts/:nftId', ({ params }) => {
    const nftId = readPathParam(params.nftId)
    const record = database.read((state) => state.nfts.find((nft) => nft.id === nftId))

    if (!record) {
      return notFound('NFT não encontrado.')
    }

    return HttpResponse.json(toNftDetail(record))
  }),
]
