import { HttpResponse } from 'msw'
import { database } from '@/mocks/db/database'
import { toNftSummary } from '@/mocks/domain/catalog-query'
import { authenticate } from '@/mocks/domain/sessions'
import { getActiveScenario } from '@/mocks/network/scenarios'
import { mockApi, readPathParam } from './mock-api'
import { apiError, notFound } from './responses'

function favoritesOf(userId: string) {
  return database.read(
    (state) => state.favorites.find((entry) => entry.userId === userId)?.nftIds ?? [],
  )
}

function changeFavorites(userId: string, change: (current: string[]) => string[]) {
  return database.write((state) => {
    const entry = state.favorites.find((candidate) => candidate.userId === userId)
    const next = change(entry?.nftIds ?? [])
    if (entry) {
      entry.nftIds = next
    } else {
      state.favorites.push({ userId, nftIds: next })
    }
    return next
  })
}

function simulatedFailure() {
  return getActiveScenario().failFavorites
    ? apiError(503, 'TRANSIENT_FAILURE', 'Não foi possível atualizar os favoritos agora.')
    : null
}

export const favoritesHandlers = [
  mockApi.get('/me/favorites/items', ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const nftIds = favoritesOf(context.user.id)
    const items = database.read((state) =>
      nftIds.flatMap((nftId) => {
        const nft = state.nfts.find((candidate) => candidate.id === nftId)
        return nft ? [toNftSummary(nft)] : []
      }),
    )
    return HttpResponse.json({ items })
  }),

  mockApi.get('/me/favorites', ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    return HttpResponse.json({ nftIds: favoritesOf(context.user.id) })
  }),

  mockApi.put('/me/favorites/:nftId', ({ request, params }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const failure = simulatedFailure()
    if (failure) {
      return failure
    }
    const nftId = readPathParam(params.nftId)
    if (!database.read((state) => state.nfts.some((nft) => nft.id === nftId))) {
      return notFound('NFT não encontrado.')
    }
    const nftIds = changeFavorites(context.user.id, (current) =>
      current.includes(nftId) ? current : [...current, nftId],
    )
    return HttpResponse.json({ nftIds })
  }),

  mockApi.delete('/me/favorites/:nftId', ({ request, params }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const failure = simulatedFailure()
    if (failure) {
      return failure
    }
    const nftId = readPathParam(params.nftId)
    const nftIds = changeFavorites(context.user.id, (current) =>
      current.filter((id) => id !== nftId),
    )
    return HttpResponse.json({ nftIds })
  }),
]
