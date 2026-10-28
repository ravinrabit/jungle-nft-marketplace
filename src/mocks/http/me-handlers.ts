import { HttpResponse } from 'msw'
import {
  avatarUpdateRequestSchema,
  passwordChangeRequestSchema,
  profileUpdateRequestSchema,
  walletSlotSchema,
  walletUpsertRequestSchema,
  type Wallet,
} from '@/shared/api/contracts/account'
import type { FieldErrors } from '@/shared/api/contracts/errors'
import { database } from '@/mocks/db/database'
import type { UserRecord, WalletRecord } from '@/mocks/db/records'
import { authenticate, toUser } from '@/mocks/domain/sessions'
import { hashPassword, verifyPassword } from '@/mocks/lib/password-hash'
import { mockApi, readPathParam } from './mock-api'
import { apiError, notFound, validationError } from './responses'

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function toWallet(record: WalletRecord): Wallet {
  const { userId, ...wallet } = record
  return wallet
}

function updateUser(userId: string, change: Partial<UserRecord>) {
  return database.write((state) => {
    const user = state.users.find((candidate) => candidate.id === userId)
    if (!user) {
      return null
    }
    Object.assign(user, change, { version: user.version + 1 })
    return { ...user }
  })
}

function findProfileConflicts(userId: string, email: string, username: string): FieldErrors {
  return database.read((state) => {
    const others = state.users.filter((user) => user.id !== userId)
    const conflicts: FieldErrors = {}
    if (others.some((user) => user.email === email)) {
      conflicts.email = ['Este e-mail já está em uso por outra conta.']
    }
    if (others.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      conflicts.username = ['Este nome de usuário já está em uso.']
    }
    return conflicts
  })
}

export const meHandlers = [
  mockApi.get('/me', ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    return HttpResponse.json(toUser(context.user))
  }),

  mockApi.put('/me', async ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }

    const body = profileUpdateRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Revise os dados do perfil.')
    }

    const conflicts = findProfileConflicts(context.user.id, body.data.email, body.data.username)
    if (Object.keys(conflicts).length > 0) {
      return apiError(409, 'CONFLICT', 'Alguns dados já estão em uso.', { fieldErrors: conflicts })
    }

    const updated = updateUser(context.user.id, body.data)
    return updated ? HttpResponse.json(toUser(updated)) : notFound('Usuário não encontrado.')
  }),

  mockApi.put('/me/avatar', async ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }

    const body = avatarUpdateRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Não foi possível usar esta imagem.')
    }

    const updated = updateUser(context.user.id, { avatarUrl: body.data.dataUrl })
    return updated ? HttpResponse.json(toUser(updated)) : notFound('Usuário não encontrado.')
  }),

  mockApi.delete('/me/avatar', ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const updated = updateUser(context.user.id, { avatarUrl: null })
    return updated ? HttpResponse.json(toUser(updated)) : notFound('Usuário não encontrado.')
  }),

  mockApi.put('/me/password', async ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }

    const body = passwordChangeRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Revise os dados da nova senha.')
    }

    const isCurrentValid = await verifyPassword(body.data.currentPassword, {
      hash: context.user.passwordHash,
      salt: context.user.passwordSalt,
    })
    if (!isCurrentValid) {
      return apiError(400, 'VALIDATION_ERROR', 'A senha atual está incorreta.', {
        fieldErrors: { currentPassword: ['A senha atual está incorreta.'] },
      })
    }

    const { hash, salt } = await hashPassword(body.data.newPassword)
    updateUser(context.user.id, { passwordHash: hash, passwordSalt: salt })
    return new HttpResponse(null, { status: 204 })
  }),

  mockApi.get('/me/wallets', ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    const items = database.read((state) =>
      state.wallets.filter((wallet) => wallet.userId === context.user.id).map(toWallet),
    )
    return HttpResponse.json({ items })
  }),

  mockApi.put('/me/wallets/:slot', async ({ request, params }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }

    const slot = walletSlotSchema.safeParse(readPathParam(params.slot))
    if (!slot.success) {
      return notFound('Tipo de carteira inexistente.')
    }

    const body = walletUpsertRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Revise os dados da carteira.')
    }

    const saved = database.write((state) => {
      const existing = state.wallets.find(
        (wallet) => wallet.userId === context.user.id && wallet.slot === slot.data,
      )
      const updatedAt = new Date().toISOString()

      if (existing) {
        Object.assign(existing, body.data, { version: existing.version + 1, updatedAt })
        return { ...existing }
      }

      const created: WalletRecord = {
        ...body.data,
        id: `wallet-${crypto.randomUUID()}`,
        userId: context.user.id,
        slot: slot.data,
        version: 1,
        updatedAt,
      }
      state.wallets.push(created)
      return created
    })

    return HttpResponse.json(toWallet(saved))
  }),
]
