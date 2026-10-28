import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { isApiError } from '@/shared/api/api-error'

export function applyServerFieldErrors<TValues extends FieldValues>(
  error: unknown,
  fields: readonly Path<TValues>[],
  setError: UseFormSetError<TValues>,
) {
  if (!isApiError(error)) {
    return false
  }

  let applied = false
  for (const field of fields) {
    const message = error.fieldErrors[field]?.[0]
    if (message) {
      setError(field, { type: 'server', message }, { shouldFocus: !applied })
      applied = true
    }
  }
  return applied
}
