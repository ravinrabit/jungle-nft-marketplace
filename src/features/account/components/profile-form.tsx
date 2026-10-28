import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  passwordChangeRequestSchema,
  profileUpdateRequestSchema,
  type User,
} from '@/shared/api/contracts/account'
import { getErrorMessage, hasErrorCode } from '@/shared/api/api-error'
import { applyServerFieldErrors } from '@/features/auth/apply-server-errors'
import { useChangePassword, useUpdateProfile } from '../api/account-queries'
import { AccountPasswordField, AccountTextField, EnsNameField } from './account-fields'
import { AvatarControl } from './avatar-control'

const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmNewPassword'] as const
const PROFILE_FIELDS = ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const

const profileFormSchema = profileUpdateRequestSchema
  .extend({
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmNewPassword: z.string(),
  })
  .superRefine((values, context) => {
    const wantsPasswordChange = PASSWORD_FIELDS.some((field) => values[field].length > 0)
    if (!wantsPasswordChange) {
      return
    }
    const result = passwordChangeRequestSchema.safeParse(values)
    for (const issue of result.error?.issues ?? []) {
      context.addIssue({ code: 'custom', path: issue.path, message: issue.message })
    }
  })

type ProfileFormValues = z.input<typeof profileFormSchema>

function toDefaults(user: User): ProfileFormValues {
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName ?? '',
    walletNickname: user.walletNickname ?? '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  }
}

export function ProfileForm({ user }: { user: User }) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const form = useForm<ProfileFormValues, unknown, z.output<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toDefaults(user),
  })
  const { errors, isSubmitting } = form.formState

  const reportError = (
    error: unknown,
    fields: readonly (keyof ProfileFormValues)[],
    prefix = '',
  ) => {
    const applied = applyServerFieldErrors(error, fields, form.setError)
    if (!applied || !hasErrorCode(error, 'VALIDATION_ERROR', 'CONFLICT')) {
      toast.error(`${prefix}${getErrorMessage(error)}`)
    }
  }

  const submit = form.handleSubmit(async (values) => {
    const { currentPassword, newPassword, confirmNewPassword, ...profile } = values

    let updated: User
    try {
      updated = await updateProfile.mutateAsync(profile)
    } catch (error) {
      reportError(error, PROFILE_FIELDS)
      return
    }

    if (!currentPassword) {
      form.reset(toDefaults(updated))
      toast.success('Perfil atualizado.')
      return
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword, confirmNewPassword })
      form.reset(toDefaults(updated))
      toast.success('Perfil e senha atualizados.')
    } catch (error) {
      form.reset({ ...toDefaults(updated), currentPassword, newPassword, confirmNewPassword })
      toast.info('Os dados do perfil foram salvos, mas a senha não foi alterada.')
      reportError(error, PASSWORD_FIELDS, 'Senha: ')
    }
  })

  return (
    <form
      noValidate
      aria-labelledby="perfil-titulo"
      onSubmit={(event) => void submit(event)}
      className="flex min-w-0 flex-1 flex-col gap-8"
    >
      <h1 id="perfil-titulo" className="text-base leading-4 font-bold text-foreground">
        Perfil do colecionador
      </h1>

      <div className="grid gap-6 md:grid-cols-2 md:gap-x-7">
        <AccountTextField
          label="Nome de exibição"
          required
          autoComplete="name"
          error={errors.displayName?.message}
          {...form.register('displayName')}
        />
        <AccountTextField
          label="Nome de usuário"
          required
          autoComplete="username"
          error={errors.username?.message}
          {...form.register('username')}
        />
        <AccountTextField
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <EnsNameField
          label="Nome ENS"
          required
          autoComplete="off"
          error={errors.ensName?.message}
          {...form.register('ensName')}
        />
        <AccountTextField
          label="Apelido da carteira"
          required
          autoComplete="off"
          error={errors.walletNickname?.message}
          {...form.register('walletNickname')}
        />
        <AvatarControl user={user} />
      </div>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-6 text-base leading-4 font-medium text-foreground">
          Alterar senha
        </legend>
        <div className="grid gap-6 md:max-w-[26.0625rem]">
          <AccountPasswordField
            label="Senha atual"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...form.register('currentPassword')}
          />
          <AccountPasswordField
            label="Nova senha"
            autoComplete="new-password"
            hint="Mínimo de 8 caracteres, com letras e números."
            error={errors.newPassword?.message}
            {...form.register('newPassword')}
          />
          <AccountPasswordField
            label="Confirmar nova senha"
            autoComplete="new-password"
            error={errors.confirmNewPassword?.message}
            {...form.register('confirmNewPassword')}
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="flex h-10 w-[8.1875rem] cursor-pointer items-center justify-center gap-2 rounded-[0.1875rem] bg-primary text-sm leading-4 font-bold text-ink hover:bg-primary-light disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Salvar
      </button>
    </form>
  )
}
