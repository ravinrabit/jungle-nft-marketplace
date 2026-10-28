import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { registerRequestSchema, type RegisterRequest } from '@/shared/api/contracts/account'
import { getErrorMessage, hasErrorCode } from '@/shared/api/api-error'
import { useRegister } from '../api/auth-queries'
import { applyServerFieldErrors } from '../apply-server-errors'
import { AuthField, PasswordField } from './auth-field'
import { AuthSubmitButton, FormAlert } from './auth-form-parts'

const REGISTER_FIELDS = ['username', 'email', 'password', 'confirmPassword'] as const

interface RegisterFormProps {
  onSuccess: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const register = useRegister()
  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((values) => {
    register.mutate(values, {
      onSuccess,
      onError: (error) => {
        applyServerFieldErrors(error, REGISTER_FIELDS, form.setError)
      },
    })
  })

  const formError =
    register.isError && !hasErrorCode(register.error, 'VALIDATION_ERROR', 'CONFLICT')
      ? getErrorMessage(register.error)
      : null

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col">
      <div className="flex flex-col gap-3 lg:px-20 lg:pt-6">
        <FormAlert message={formError} />
        <AuthField
          label="Nome de usuário"
          autoComplete="username"
          error={errors.username?.message}
          {...form.register('username')}
        />
        <AuthField
          label="Digite seu e-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <PasswordField
          label="Senha"
          autoComplete="new-password"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <PasswordField
          label="Confirmar senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />
      </div>
      <div className="pt-10 lg:px-20 lg:pt-6">
        <AuthSubmitButton isPending={register.isPending} pendingLabel="Criando conta...">
          <span className="lg:hidden">Criar perfil</span>
          <span className="hidden lg:inline">Criar conta</span>
        </AuthSubmitButton>
      </div>
    </form>
  )
}
