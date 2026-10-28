import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

const FIELD_CLASSES =
  'h-[3.125rem] w-full rounded-[0.625rem] border border-border bg-transparent px-4 text-sm leading-4 text-foreground outline-none transition-colors placeholder:text-price-muted focus-visible:border-primary aria-invalid:border-error lg:h-10 lg:rounded-[0.3125rem]'

interface AuthFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string
  error?: string | undefined
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) {
    return null
  }
  return (
    <p id={id} className="text-xs leading-4 text-text-coral">
      {message}
    </p>
  )
}

export function AuthField({ label, error, className, ...inputProps }: AuthFieldProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        placeholder={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(FIELD_CLASSES, className)}
        {...inputProps}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}

export function PasswordField({ label, error, className, ...inputProps }: AuthFieldProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(FIELD_CLASSES, 'pr-12', className)}
          {...inputProps}
        />
        <button
          type="button"
          aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={isVisible}
          aria-controls={inputId}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center text-price-muted hover:text-text-accent"
          onClick={() => {
            setIsVisible((current) => !current)
          }}
        >
          {isVisible ? (
            <Eye aria-hidden="true" className="size-[1.125rem]" />
          ) : (
            <EyeOff aria-hidden="true" className="size-[1.125rem]" />
          )}
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
