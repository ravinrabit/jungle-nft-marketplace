import type { Session, User } from '@/shared/api/contracts/account'
import { database } from '@/mocks/db/database'
import type { SessionRecord, UserRecord } from '@/mocks/db/records'
import { apiError } from '@/mocks/http/responses'
import { DEFAULT_SESSION_TTL_MS, getActiveScenario } from '@/mocks/network/scenarios'

const BEARER_PREFIX = 'Bearer '
const TOKEN_BYTES = 32

export function toUser(record: UserRecord): User {
  const { passwordHash, passwordSalt, ...user } = record
  return user
}

function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function openSession(userId: string) {
  const now = Date.now()
  const ttl = getActiveScenario().sessionTtlMs ?? DEFAULT_SESSION_TTL_MS
  const session: SessionRecord = {
    token: generateToken(),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl).toISOString(),
  }

  database.write((state) => {
    state.sessions = state.sessions.filter((existing) => Date.parse(existing.expiresAt) > now)
    state.sessions.push(session)
  })

  return session
}

export function closeSession(token: string) {
  database.write((state) => {
    state.sessions = state.sessions.filter((session) => session.token !== token)
  })
}

export function expireAllSessions() {
  const past = new Date(Date.now() - 1_000).toISOString()
  database.write((state) => {
    state.sessions = state.sessions.map((session) => ({ ...session, expiresAt: past }))
  })
}

export function toSessionPayload(session: SessionRecord, user: UserRecord): Session {
  return { user: toUser(user), expiresAt: session.expiresAt }
}

export function readBearerToken(request: Request) {
  const header = request.headers.get('Authorization')
  return header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : null
}

export interface AuthenticatedContext {
  token: string
  session: SessionRecord
  user: UserRecord
}

export function authenticate(request: Request): AuthenticatedContext | Response {
  const token = readBearerToken(request)
  if (!token) {
    return apiError(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.')
  }

  const context = database.read((state) => {
    const session = state.sessions.find((candidate) => candidate.token === token)
    const user = session && state.users.find((candidate) => candidate.id === session.userId)
    return session && user ? { session, user } : null
  })

  if (!context || Date.parse(context.session.expiresAt) <= Date.now()) {
    closeSession(token)
    return apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
  }

  return { token, ...context }
}
