import { HttpResponse } from 'msw'
import { z } from 'zod'
import {
  addCartItemRequestSchema,
  GUEST_CART_HEADER,
  mergeCartRequestSchema,
  quoteRequestSchema,
  updateCartItemRequestSchema,
} from '@/shared/api/contracts/commerce'
import { database } from '@/mocks/db/database'
import type { CartOwner } from '@/mocks/db/records'
import {
  buildQuote,
  findCart,
  findOrCreateCart,
  mergeCarts,
  resolveCoupon,
  resolveEdition,
  storeQuote,
  toCartPayload,
  touchCart,
} from '@/mocks/domain/cart'
import { authenticate, readBearerToken } from '@/mocks/domain/sessions'
import { mockApi, readJson, readPathParam } from './mock-api'
import { apiError, notFound, validationError } from './responses'

const guestIdSchema = z.uuid()

function resolveOwner(request: Request): CartOwner | null | Response {
  if (readBearerToken(request)) {
    const context = authenticate(request)
    return context instanceof Response ? context : { kind: 'user', userId: context.user.id }
  }
  const guestId = guestIdSchema.safeParse(request.headers.get(GUEST_CART_HEADER))
  return guestId.success ? { kind: 'guest', guestId: guestId.data } : null
}

function requireOwner(request: Request): CartOwner | Response {
  const owner = resolveOwner(request)
  if (owner === null) {
    return apiError(400, 'VALIDATION_ERROR', 'Não foi possível identificar o carrinho.')
  }
  return owner
}

function availabilityConflict(name: string, limit: number, inCart: number) {
  const message =
    limit === 0
      ? `${name} está esgotado nesta edição.`
      : `Só é possível ter ${limit} unidade(s) de ${name} nesta edição.`
  return apiError(409, 'AVAILABILITY_CONFLICT', message, {
    details: { available: limit, inCart },
  })
}

export const cartHandlers = [
  mockApi.get('/cart', ({ request }) => {
    const owner = resolveOwner(request)
    if (owner instanceof Response) {
      return owner
    }
    const cart = database.read((state) =>
      toCartPayload(state, owner ? findCart(state, owner) : undefined),
    )
    return HttpResponse.json(cart)
  }),

  mockApi.post('/cart/items', async ({ request }) => {
    const owner = requireOwner(request)
    if (owner instanceof Response) {
      return owner
    }
    const body = addCartItemRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Item de carrinho inválido.')
    }

    return database.write((state) => {
      const resolved = resolveEdition(state, body.data.nftId, body.data.editionKind)
      if (!resolved) {
        return notFound('NFT ou edição não encontrados.')
      }

      const cart = findOrCreateCart(state, owner)
      const existing = cart.items.find(
        (item) => item.nftId === body.data.nftId && item.editionKind === body.data.editionKind,
      )
      const inCart = existing?.quantity ?? 0
      if (inCart + body.data.quantity > resolved.limit) {
        return availabilityConflict(resolved.nft.name, resolved.limit, inCart)
      }

      if (existing) {
        existing.quantity += body.data.quantity
      } else {
        cart.items.push({
          id: `item-${crypto.randomUUID()}`,
          nftId: body.data.nftId,
          editionKind: body.data.editionKind,
          quantity: body.data.quantity,
          addedUnitPrice: resolved.edition.price,
        })
      }
      touchCart(cart)
      return HttpResponse.json(toCartPayload(state, cart), { status: 201 })
    })
  }),

  mockApi.patch('/cart/items/:itemId', async ({ request, params }) => {
    const owner = requireOwner(request)
    if (owner instanceof Response) {
      return owner
    }
    const body = updateCartItemRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Quantidade inválida.')
    }
    const itemId = readPathParam(params.itemId)

    return database.write((state) => {
      const cart = findCart(state, owner)
      const item = cart?.items.find((candidate) => candidate.id === itemId)
      if (!cart || !item) {
        return notFound('Item não encontrado no carrinho.')
      }
      const resolved = resolveEdition(state, item.nftId, item.editionKind)
      if (!resolved) {
        return notFound('NFT ou edição não encontrados.')
      }
      if (body.data.quantity > resolved.limit) {
        return availabilityConflict(resolved.nft.name, resolved.limit, item.quantity)
      }
      item.quantity = body.data.quantity
      touchCart(cart)
      return HttpResponse.json(toCartPayload(state, cart))
    })
  }),

  mockApi.delete('/cart/items/:itemId', ({ request, params }) => {
    const owner = requireOwner(request)
    if (owner instanceof Response) {
      return owner
    }
    const itemId = readPathParam(params.itemId)

    return database.write((state) => {
      const cart = findCart(state, owner)
      if (!cart?.items.some((item) => item.id === itemId)) {
        return notFound('Item não encontrado no carrinho.')
      }
      cart.items = cart.items.filter((item) => item.id !== itemId)
      touchCart(cart)
      return HttpResponse.json(toCartPayload(state, cart))
    })
  }),

  mockApi.post('/cart/merge', async ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const body = mergeCartRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Carrinho de visitante inválido.')
    }

    return database.write((state) => {
      const userOwner: CartOwner = { kind: 'user', userId: context.user.id }
      const target = findOrCreateCart(state, userOwner)
      const source = findCart(state, { kind: 'guest', guestId: body.data.guestCartId })
      const adjustments = source ? mergeCarts(state, source, target) : []
      return HttpResponse.json(toCartPayload(state, target, adjustments))
    })
  }),

  mockApi.post('/cart/quote', async ({ request }) => {
    const owner = requireOwner(request)
    if (owner instanceof Response) {
      return owner
    }
    const body = quoteRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Dados de cotação inválidos.')
    }

    const coupon = resolveCoupon(body.data.couponCode)
    if (coupon.status === 'invalid') {
      return apiError(422, 'COUPON_INVALID', 'Este cupom não existe.', {
        fieldErrors: { couponCode: ['Cupom inválido.'] },
      })
    }
    if (coupon.status === 'expired') {
      return apiError(422, 'COUPON_EXPIRED', 'Este cupom expirou.', {
        fieldErrors: { couponCode: ['Cupom expirado.'] },
      })
    }

    return database.write((state) => {
      const cart = toCartPayload(state, findCart(state, owner))
      if (cart.items.length === 0) {
        return apiError(400, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
      }

      const quote = buildQuote(
        cart,
        coupon.status === 'valid' ? coupon.coupon : null,
        body.data.network,
      )
      storeQuote(state, owner, quote)
      return HttpResponse.json(quote)
    })
  }),
]
