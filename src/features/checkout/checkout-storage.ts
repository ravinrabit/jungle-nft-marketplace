import { z } from 'zod'
import { onSessionEnded } from '@/features/auth/session-lifecycle'
import type { CheckoutFormValues } from './checkout-form'

const STORAGE_PREFIX = 'kurio:checkout:'

const attemptSchema = z.object({ key: z.uuid(), fingerprint: z.string() })

const draftSchema = z.object({
  walletId: z.string(),
  provider: z.string(),
  network: z.string(),
  displayName: z.string(),
  username: z.string(),
  profileName: z.string(),
  referralCode: z.string(),
  email: z.string(),
  ensName: z.string(),
  note: z.string(),
})

function storageKey(kind: 'attempt' | 'draft', userId: string) {
  return `${STORAGE_PREFIX}${kind}:${userId}`
}

function readJson<TSchema extends z.ZodType>(key: string, schema: TSchema) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) {
      return null
    }
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Não foi possível guardar o progresso do pagamento', error)
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch (error) {
    console.warn('Não foi possível limpar o progresso do pagamento', error)
  }
}

export const checkoutAttempt = {
  keyFor(userId: string, payload: unknown) {
    const fingerprint = JSON.stringify(payload)
    const stored = readJson(storageKey('attempt', userId), attemptSchema)
    if (stored?.fingerprint === fingerprint) {
      return stored.key
    }
    const key = crypto.randomUUID()
    writeJson(storageKey('attempt', userId), { key, fingerprint })
    return key
  },
  clear(userId: string) {
    remove(storageKey('attempt', userId))
  },
}

export const checkoutDraft = {
  read(userId: string): CheckoutFormValues | null {
    return readJson(storageKey('draft', userId), draftSchema)
  },
  write(userId: string, values: CheckoutFormValues) {
    writeJson(storageKey('draft', userId), values)
  },
  clear(userId: string) {
    remove(storageKey('draft', userId))
  },
}

function clearAllCheckoutStorage() {
  try {
    const keys = Array.from({ length: sessionStorage.length }, (_, index) =>
      sessionStorage.key(index),
    )
    for (const key of keys) {
      if (key?.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    }
  } catch (error) {
    console.warn('Não foi possível limpar o progresso do pagamento', error)
  }
}

export function registerCheckoutCleanup() {
  return onSessionEnded((reason) => {
    if (reason === 'signed-out') {
      clearAllCheckoutStorage()
    }
  })
}
