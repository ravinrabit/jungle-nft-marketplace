type SearchPrimitive = string | number | boolean

function isSearchPrimitive(value: unknown): value is SearchPrimitive {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function serializeValue(value: unknown) {
  if (isSearchPrimitive(value)) {
    return String(value)
  }
  if (Array.isArray(value)) {
    const items = value.filter(isSearchPrimitive).map(String)
    return items.length > 0 ? items.join(',') : null
  }
  return null
}

export function parseSearch(searchString: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(searchString))
}

export function stringifySearch(search: Record<string, unknown>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(search)) {
    const serialized = serializeValue(value)
    if (serialized !== null && serialized !== '') {
      params.set(key, serialized)
    }
  }

  const query = params.toString().replaceAll('%2C', ',')
  return query ? `?${query}` : ''
}
