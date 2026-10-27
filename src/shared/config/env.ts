import { z } from 'zod'

const envSchema = z.object({
  VITE_API_MOCKING: z.enum(['enabled', 'disabled']).default('enabled'),
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_SOCKET_URL: z.url().optional(),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
})

const parsed = envSchema.parse(import.meta.env)

export const env = {
  isMockingEnabled: parsed.VITE_API_MOCKING === 'enabled',
  apiBaseUrl: parsed.VITE_API_BASE_URL,
  socketUrl: parsed.VITE_SOCKET_URL ?? window.location.origin,
  apiTimeoutMs: parsed.VITE_API_TIMEOUT_MS,
} as const
