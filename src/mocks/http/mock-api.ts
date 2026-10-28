import { http } from 'msw'
import { env } from '@/shared/config/env'
import { simulateNetworkConditions } from '@/mocks/network/network-conditions'

type Resolver = Parameters<typeof http.get>[1]

function withNetworkConditions(resolver: Resolver): Resolver {
  return async (info) => {
    const interruption = await simulateNetworkConditions()
    return interruption ?? resolver(info)
  }
}

function apiPath(path: string) {
  return `${env.apiBaseUrl}${path}`
}

export const mockApi = {
  get: (path: string, resolver: Resolver) =>
    http.get(apiPath(path), withNetworkConditions(resolver)),
  post: (path: string, resolver: Resolver) =>
    http.post(apiPath(path), withNetworkConditions(resolver)),
  put: (path: string, resolver: Resolver) =>
    http.put(apiPath(path), withNetworkConditions(resolver)),
  patch: (path: string, resolver: Resolver) =>
    http.patch(apiPath(path), withNetworkConditions(resolver)),
  delete: (path: string, resolver: Resolver) =>
    http.delete(apiPath(path), withNetworkConditions(resolver)),
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function readPathParam(value: string | readonly string[] | undefined) {
  if (typeof value === 'string') {
    return value
  }
  return value?.[0] ?? ''
}
