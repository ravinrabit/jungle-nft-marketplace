import { z } from 'zod'

export const AUTH_MODES = ['entrar', 'cadastro', 'recuperar'] as const

export type AuthMode = (typeof AUTH_MODES)[number]

const MAX_REDIRECT_LENGTH = 500

const UNSAFE_REDIRECT_CHARACTERS = /[\s\\\p{Cc}]/u
const REDIRECT_RESOLUTION_BASE = 'https://kurio.invalid'

function staysOnSameOrigin(value: string) {
  try {
    return new URL(value, REDIRECT_RESOLUTION_BASE).origin === REDIRECT_RESOLUTION_BASE
  } catch {
    return false
  }
}

export function isSafeRedirect(value: string) {
  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !UNSAFE_REDIRECT_CHARACTERS.test(value) &&
    value.length <= MAX_REDIRECT_LENGTH &&
    staysOnSameOrigin(value)
  )
}

export const authSearchSchema = z.object({
  auth: z.enum(AUTH_MODES).optional().catch(undefined),
  redirect: z.string().refine(isSafeRedirect).optional().catch(undefined),
})

export type AuthSearch = z.output<typeof authSearchSchema>
