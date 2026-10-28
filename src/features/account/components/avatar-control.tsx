import { ImageIcon, Loader2 } from 'lucide-react'
import { useId, useRef, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { MAX_AVATAR_BYTES, type User } from '@/shared/api/contracts/account'
import { getErrorMessage } from '@/shared/api/api-error'
import { useRemoveAvatar, useUpdateAvatar } from '../api/account-queries'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Leitura de imagem inválida'))
      }
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Falha ao ler a imagem'))
    }
    reader.readAsDataURL(file)
  })
}

function validateFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Envie uma imagem PNG, JPG ou WebP.'
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return 'A imagem deve ter no máximo 512 KB.'
  }
  return null
}

export function AvatarControl({ user }: { user: User }) {
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const fileInput = useRef<HTMLInputElement>(null)
  const updateAvatar = useUpdateAvatar()
  const removeAvatar = useRemoveAvatar()
  const isBusy = updateAvatar.isPending || removeAvatar.isPending

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    const problem = validateFile(file)
    if (problem) {
      toast.error(problem)
      return
    }

    try {
      const dataUrl = await readAsDataUrl(file)
      await updateAvatar.mutateAsync(dataUrl)
      toast.success('Avatar atualizado.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <span className="flex h-[0.9375rem] items-center text-[0.9375rem] leading-[0.9375rem] text-foreground">
        Avatar
      </span>
      <div className="flex items-center gap-6">
        <span className="flex size-[3.125rem] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-raised">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`Avatar de ${user.displayName}`}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon aria-hidden="true" className="size-[1.125rem] text-primary" />
          )}
        </span>
        <div className="flex items-center gap-5">
          <input
            ref={fileInput}
            id={inputId}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            aria-describedby={hintId}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => void handleFile(event)}
          />
          <button
            type="button"
            disabled={isBusy}
            aria-describedby={hintId}
            className="flex h-10 w-[6.125rem] cursor-pointer items-center justify-center gap-2 rounded-[0.1875rem] bg-primary text-sm leading-4 font-bold text-ink hover:bg-primary-light disabled:opacity-60"
            onClick={() => fileInput.current?.click()}
          >
            {updateAvatar.isPending && (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            )}
            Alterar
          </button>
          <button
            type="button"
            disabled={isBusy || !user.avatarUrl}
            className="cursor-pointer text-sm leading-4 text-foreground hover:text-text-accent disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              removeAvatar.mutate(undefined, {
                onSuccess: () => toast.success('Avatar removido.'),
                onError: (error) => toast.error(getErrorMessage(error)),
              })
            }}
          >
            Remover
          </button>
        </div>
      </div>
      <p id={hintId} className="sr-only">
        PNG, JPG ou WebP com até 512 KB.
      </p>
    </div>
  )
}
