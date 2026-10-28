import { z } from 'zod'

export const AUTH_MODES = ['entrar', 'cadastro'] as const

export type AuthMode = (typeof AUTH_MODES)[number]

const MAX_REDIRECT_LENGTH = 500

export function isSafeRedirect(value: string) {
  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    value.length <= MAX_REDIRECT_LENGTH
  )
}

export const authSearchSchema = z.object({
  auth: z.enum(AUTH_MODES).optional().catch(undefined),
  redirect: z.string().refine(isSafeRedirect).optional().catch(undefined),
})

export type AuthSearch = z.output<typeof authSearchSchema>
