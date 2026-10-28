import { HttpResponse } from 'msw'
import { loginRequestSchema, registerRequestSchema } from '@/shared/api/contracts/account'
import type { FieldErrors } from '@/shared/api/contracts/errors'
import { database } from '@/mocks/db/database'
import type { UserRecord } from '@/mocks/db/records'
import {
  authenticate,
  closeSession,
  openSession,
  readBearerToken,
  toSessionPayload,
} from '@/mocks/domain/sessions'
import { hashPassword, verifyPassword } from '@/mocks/lib/password-hash'
import { mockApi, readJson } from './mock-api'
import { apiError, validationError } from './responses'

function findRegistrationConflicts(email: string, username: string): FieldErrors {
  return database.read((state) => {
    const conflicts: FieldErrors = {}
    if (state.users.some((user) => user.email === email)) {
      conflicts.email = ['Este e-mail já está cadastrado.']
    }
    if (state.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      conflicts.username = ['Este nome de usuário já está em uso.']
    }
    return conflicts
  })
}

function authResponse(user: UserRecord, status: number) {
  const session = openSession(user.id)
  return HttpResponse.json(
    { token: session.token, session: toSessionPayload(session, user) },
    { status },
  )
}

export const authHandlers = [
  mockApi.post('/auth/register', async ({ request }) => {
    const body = registerRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Revise os dados do cadastro.')
    }

    const { email, username, password } = body.data
    const conflicts = findRegistrationConflicts(email, username)
    if (Object.keys(conflicts).length > 0) {
      return apiError(409, 'CONFLICT', 'Já existe uma conta com estes dados.', {
        fieldErrors: conflicts,
      })
    }

    const { hash, salt } = await hashPassword(password)
    const user: UserRecord = {
      id: `user-${crypto.randomUUID()}`,
      username,
      displayName: username,
      email,
      ensName: null,
      walletNickname: null,
      avatarUrl: null,
      version: 1,
      passwordHash: hash,
      passwordSalt: salt,
    }

    database.write((state) => {
      state.users.push(user)
    })

    return authResponse(user, 201)
  }),

  mockApi.post('/auth/login', async ({ request }) => {
    const body = loginRequestSchema.safeParse(await readJson(request))
    if (!body.success) {
      return validationError(body.error, 'Revise os dados de acesso.')
    }

    const user = database.read((state) =>
      state.users.find((candidate) => candidate.email === body.data.email),
    )
    const isValid =
      user !== undefined &&
      (await verifyPassword(body.data.password, {
        hash: user.passwordHash,
        salt: user.passwordSalt,
      }))

    if (!user || !isValid) {
      return apiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }

    return authResponse(user, 200)
  }),

  mockApi.get('/auth/session', ({ request }) => {
    const context = authenticate(request)
    if (context instanceof Response) {
      return context
    }
    return HttpResponse.json(toSessionPayload(context.session, context.user))
  }),

  mockApi.post('/auth/logout', ({ request }) => {
    const token = readBearerToken(request)
    if (token) {
      closeSession(token)
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
