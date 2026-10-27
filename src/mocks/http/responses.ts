import { HttpResponse } from 'msw'
import type { z } from 'zod'
import type { ApiErrorBody, ApiErrorCode, FieldErrors } from '@/shared/api/contracts/errors'

let requestSequence = 0

function nextRequestId() {
  requestSequence += 1
  return `req_${String(requestSequence).padStart(6, '0')}`
}

interface ErrorExtras {
  fieldErrors?: FieldErrors
  details?: Record<string, unknown>
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extras: ErrorExtras = {},
) {
  const body: ApiErrorBody = {
    error: { code, message, ...extras },
    requestId: nextRequestId(),
  }
  return HttpResponse.json(body, { status })
}

export function validationError(error: z.ZodError, message = 'Os dados enviados são inválidos.') {
  const fieldErrors: FieldErrors = {}

  for (const issue of error.issues) {
    const field = issue.path.map(String).join('.') || 'root'
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
  }

  return apiError(400, 'VALIDATION_ERROR', message, { fieldErrors })
}

export function notFound(message: string) {
  return apiError(404, 'NOT_FOUND', message)
}
