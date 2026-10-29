import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  passwordResetRequestSchema,
  type PasswordResetRequest,
} from '@/shared/api/contracts/account'
import { getErrorMessage, hasErrorCode } from '@/shared/api/api-error'
import { requestPasswordReset } from '../api/auth-api'
import { applyServerFieldErrors } from '../apply-server-errors'
import { AuthField } from './auth-field'
import { AuthSubmitButton, FormAlert } from './auth-form-parts'

interface PasswordResetFormProps {
  onBackToLogin: () => void
}

export function PasswordResetForm({ onBackToLogin }: PasswordResetFormProps) {
  const reset = useMutation({ mutationFn: requestPasswordReset })
  const form = useForm<PasswordResetRequest>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((values) => {
    reset.mutate(values, {
      onError: (error) => {
        applyServerFieldErrors(error, ['email'], form.setError)
      },
    })
  })

  if (reset.isSuccess) {
    return (
      <div className="flex flex-col gap-6 lg:px-20 lg:pt-6">
        <p
          role="status"
          className="rounded-[0.3125rem] border border-success/50 bg-success/10 px-3 py-3 text-sm leading-5 text-foreground"
        >
          Se existir uma conta com {reset.variables.email}, você receberá em instantes as instruções
          para redefinir a senha.
        </p>
        <button
          type="button"
          className="flex h-[3.75rem] w-full cursor-pointer items-center justify-center rounded-[0.625rem] border border-primary text-base leading-4 font-bold text-text-accent lg:h-[2.8125rem] lg:rounded-[0.3125rem]"
          onClick={onBackToLogin}
        >
          Voltar para o login
        </button>
      </div>
    )
  }

  const formError =
    reset.isError && !hasErrorCode(reset.error, 'VALIDATION_ERROR')
      ? getErrorMessage(reset.error)
      : null

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col">
      <div className="flex flex-col gap-3 lg:px-20 lg:pt-6">
        <FormAlert message={formError} />
        <AuthField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="contato@email.com"
          error={errors.email?.message}
          {...form.register('email')}
        />
      </div>
      <div className="flex flex-col gap-4 pt-10 lg:px-20 lg:pt-6">
        <AuthSubmitButton isPending={reset.isPending} pendingLabel="Enviando...">
          Enviar instruções
        </AuthSubmitButton>
        <button
          type="button"
          className="cursor-pointer text-center text-sm leading-4 text-text-accent hover:underline"
          onClick={onBackToLogin}
        >
          Voltar para o login
        </button>
      </div>
    </form>
  )
}
