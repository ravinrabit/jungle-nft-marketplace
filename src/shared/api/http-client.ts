import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { env } from '@/shared/config/env'
import { ApiError, toApiError } from './api-error'

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue | readonly QueryValue[]>

export function serializeQueryParams(params: QueryParams) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item !== undefined && item !== null && item !== '') {
        search.append(key, String(item))
      }
    }
  }

  return search.toString()
}

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: { Accept: 'application/json' },
  paramsSerializer: { serialize: (params) => serializeQueryParams(params as QueryParams) },
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)

export async function requestData<TSchema extends z.ZodType>(
  schema: TSchema,
  config: AxiosRequestConfig,
): Promise<z.output<TSchema>> {
  const response = await httpClient.request<unknown>(config)
  const parsed = schema.safeParse(response.data)

  if (!parsed.success) {
    throw new ApiError('INVALID_RESPONSE', undefined, {
      status: response.status,
      cause: parsed.error,
    })
  }

  return parsed.data
}

export async function requestWithoutContent(config: AxiosRequestConfig) {
  await httpClient.request(config)
}
