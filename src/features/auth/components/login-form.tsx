import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { loginRequestSchema, type LoginRequest } from '@/shared/api/contracts/account'
import { getErrorMessage, hasErrorCode } from '@/shared/api/api-error'
import { notifyUnavailableFeature } from '@/shared/lib/unavailable-feature'
import { useLogin } from '../api/auth-queries'
import { applyServerFieldErrors } from '../apply-server-errors'
import { AuthField, PasswordField } from './auth-field'
import { AuthSubmitButton, FormAlert } from './auth-form-parts'

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const login = useLogin()
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess,
      onError: (error) => {
        applyServerFieldErrors(error, ['email', 'password'], form.setError)
      },
    })
  })

  const formError =
    login.isError && !hasErrorCode(login.error, 'VALIDATION_ERROR')
      ? getErrorMessage(login.error)
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
        <PasswordField
          label="Senha"
          autoComplete="current-password"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <div className="flex justify-end">
          <button
            type="button"
            className="cursor-pointer text-sm leading-4 text-text-accent hover:underline"
            onClick={() => {
              notifyUnavailableFeature('A recuperação de senha')
            }}
          >
            Esqueceu a senha?
          </button>
        </div>
      </div>
      <div className="pt-10 lg:px-20 lg:pt-6">
        <AuthSubmitButton isPending={login.isPending} pendingLabel="Entrando...">
          Entrar
        </AuthSubmitButton>
      </div>
    </form>
  )
}
