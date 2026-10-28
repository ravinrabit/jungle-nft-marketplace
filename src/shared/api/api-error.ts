import { isAxiosError, isCancel } from 'axios'
import { apiErrorBodySchema, type ApiErrorCode, type FieldErrors } from './contracts/errors'

export type ClientErrorCode =
  ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'CANCELED' | 'INVALID_RESPONSE' | 'UNKNOWN'

interface ApiErrorOptions {
  status?: number | null
  fieldErrors?: FieldErrors
  details?: Record<string, unknown>
  requestId?: string | null
  cause?: unknown
}

const FALLBACK_MESSAGES: Record<ClientErrorCode, string> = {
  VALIDATION_ERROR: 'Revise os campos destacados e tente novamente.',
  UNAUTHENTICATED: 'Entre na sua conta para continuar.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente para continuar.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'O recurso solicitado não foi encontrado.',
  CONFLICT: 'Os dados enviados entram em conflito com um registro existente.',
  AVAILABILITY_CONFLICT: 'A quantidade solicitada não está mais disponível.',
  PRICE_CHANGED: 'O preço de um item mudou. Revise antes de continuar.',
  QUOTE_EXPIRED: 'A cotação expirou. Atualize os valores antes de continuar.',
  COUPON_INVALID: 'O cupom informado não é válido.',
  COUPON_EXPIRED: 'O cupom informado expirou.',
  IDEMPOTENCY_CONFLICT: 'Esta tentativa de compra já foi usada com outros dados.',
  PAYMENT_DECLINED: 'O pagamento foi recusado pela carteira.',
  TRANSIENT_FAILURE: 'O serviço está instável no momento. Tente novamente em instantes.',
  INTERNAL_ERROR: 'Ocorreu um erro inesperado no servidor.',
  NETWORK_ERROR: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
  TIMEOUT: 'O servidor demorou para responder. Tente novamente.',
  CANCELED: 'A requisição foi cancelada.',
  INVALID_RESPONSE: 'O servidor respondeu em um formato inesperado.',
  UNKNOWN: 'Ocorreu um erro inesperado.',
}

const RETRYABLE_CODES: ReadonlySet<ClientErrorCode> = new Set([
  'NETWORK_ERROR',
  'TIMEOUT',
  'TRANSIENT_FAILURE',
  'INTERNAL_ERROR',
])

export class ApiError extends Error {
  override readonly name = 'ApiError'
  readonly code: ClientErrorCode
  readonly status: number | null
  readonly fieldErrors: FieldErrors
  readonly details: Record<string, unknown>
  readonly requestId: string | null

  constructor(code: ClientErrorCode, message?: string, options: ApiErrorOptions = {}) {
    super(message ?? FALLBACK_MESSAGES[code], { cause: options.cause })
    this.code = code
    this.status = options.status ?? null
    this.fieldErrors = options.fieldErrors ?? {}
    this.details = options.details ?? {}
    this.requestId = options.requestId ?? null
  }

  get isRetryable() {
    return RETRYABLE_CODES.has(this.code)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function hasErrorCode(error: unknown, ...codes: ClientErrorCode[]) {
  return isApiError(error) && codes.includes(error.code)
}

export function getErrorMessage(error: unknown) {
  return isApiError(error) ? error.message : FALLBACK_MESSAGES.UNKNOWN
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  if (isCancel(error)) {
    return new ApiError('CANCELED', undefined, { cause: error })
  }

  if (!isAxiosError(error)) {
    return new ApiError('UNKNOWN', undefined, { cause: error })
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError('TIMEOUT', undefined, { cause: error })
  }

  if (!error.response) {
    return new ApiError('NETWORK_ERROR', undefined, { cause: error })
  }

  const status = error.response.status
  const body = apiErrorBodySchema.safeParse(error.response.data as unknown)

  if (!body.success) {
    const code: ClientErrorCode = status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN'
    return new ApiError(code, undefined, { status, cause: error })
  }

  const { code, message, fieldErrors, details } = body.data.error
  return new ApiError(code, message, {
    status,
    requestId: body.data.requestId,
    cause: error,
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(details ? { details } : {}),
  })
}
