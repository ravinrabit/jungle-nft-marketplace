import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

export const ACCOUNT_INPUT =
  'h-10 w-full rounded-[0.1875rem] border border-border bg-transparent px-4 text-sm leading-[0.9375rem] text-foreground outline-none transition-colors placeholder:text-price-muted focus-visible:border-primary aria-invalid:border-error'

interface FieldShellProps {
  inputId: string
  label: string
  required: boolean
  error: string | undefined
  hint?: string | undefined
  children: ReactNode
}

function FieldShell({ inputId, label, required, error, hint, children }: FieldShellProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <label
        htmlFor={inputId}
        className="flex h-[1.8125rem] items-center text-[0.9375rem] leading-[0.9375rem] text-foreground"
      >
        {label}
        {required && (
          <span
            aria-hidden="true"
            className="ml-0.5 text-[1.375rem] leading-[1.8125rem] text-text-coral"
          >
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs leading-4 text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs leading-4 text-text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

function describedBy(inputId: string, error: string | undefined, hint: string | undefined) {
  if (error) {
    return `${inputId}-error`
  }
  return hint ? `${inputId}-hint` : undefined
}

interface AccountTextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string
  error?: string | undefined
  hint?: string | undefined
}

export function AccountTextField({
  label,
  error,
  hint,
  required = false,
  className,
  ...inputProps
}: AccountTextFieldProps) {
  const inputId = useId()

  return (
    <FieldShell inputId={inputId} label={label} required={required} error={error} hint={hint}>
      <input
        id={inputId}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        className={cn(ACCOUNT_INPUT, className)}
        {...inputProps}
      />
    </FieldShell>
  )
}

export function AccountPasswordField({
  label,
  error,
  hint,
  required = false,
  ...inputProps
}: AccountTextFieldProps) {
  const inputId = useId()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <FieldShell inputId={inputId} label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <input
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={cn(ACCOUNT_INPUT, 'pr-12')}
          {...inputProps}
        />
        <button
          type="button"
          aria-label={
            isVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`
          }
          aria-pressed={isVisible}
          aria-controls={inputId}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center text-price-muted hover:text-text-accent"
          onClick={() => {
            setIsVisible((current) => !current)
          }}
        >
          {isVisible ? (
            <Eye aria-hidden="true" className="size-4" />
          ) : (
            <EyeOff aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
    </FieldShell>
  )
}

export function EnsNameField({
  label,
  error,
  hint,
  required = false,
  ...inputProps
}: AccountTextFieldProps) {
  const inputId = useId()

  return (
    <FieldShell inputId={inputId} label={label} required={required} error={error} hint={hint}>
      <div className="flex gap-2.5">
        <span className="flex h-10 w-[4.875rem] shrink-0 items-center justify-center rounded-[0.1875rem] border border-border text-[0.9375rem] leading-[0.9375rem] text-foreground">
          .eth
        </span>
        <input
          id={inputId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={ACCOUNT_INPUT}
          {...inputProps}
        />
      </div>
    </FieldShell>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface AccountSelectFieldProps {
  label: string
  placeholder: string
  options: readonly SelectOption[]
  value: string
  required?: boolean
  error?: string | undefined
  onChange: (value: string) => void
  onBlur: () => void
}

export function AccountSelectField({
  label,
  placeholder,
  options,
  value,
  required = false,
  error,
  onChange,
  onBlur,
}: AccountSelectFieldProps) {
  const inputId = useId()

  return (
    <FieldShell inputId={inputId} label={label} required={required} error={error}>
      <Select
        value={value}
        onValueChange={onChange}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onBlur()
          }
        }}
      >
        <SelectTrigger
          id={inputId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            ACCOUNT_INPUT,
            'cursor-pointer justify-between shadow-none data-[placeholder]:text-price-muted dark:bg-transparent',
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border-border bg-surface-card">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}
