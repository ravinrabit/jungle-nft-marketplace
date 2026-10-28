import { Minus, Plus } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'

const stepperButton = cva(
  'flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-primary bg-ink text-foreground transition-colors hover:bg-primary hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink disabled:hover:text-foreground',
  {
    variants: {
      size: {
        large: 'h-[3.09375rem] w-[2.0625rem] [&_svg]:size-[1.125rem]',
        small: 'h-[1.875rem] w-5 [&_svg]:size-3',
      },
    },
    defaultVariants: { size: 'large' },
  },
)

const valueText = cva('min-w-6 text-center tabular-nums text-foreground', {
  variants: {
    size: {
      large: 'text-xl leading-7',
      small: 'text-lg leading-[1.5625rem] font-medium',
    },
  },
  defaultVariants: { size: 'large' },
})

interface QuantityStepperProps extends VariantProps<typeof stepperButton> {
  value: number
  min?: number
  max: number
  label: string
  disabled?: boolean
  onChange: (value: number) => void
  className?: string
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  label,
  disabled = false,
  size,
  onChange,
  className,
}: QuantityStepperProps) {
  const canDecrease = !disabled && value > min
  const canIncrease = !disabled && value < max

  return (
    <div role="group" aria-label={label} className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={!canDecrease}
        className={stepperButton({ size })}
        onClick={() => {
          onChange(value - 1)
        }}
      >
        <Minus aria-hidden="true" />
      </button>
      <output aria-live="polite" aria-label={`${label}: ${value}`} className={valueText({ size })}>
        {value}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={!canIncrease}
        className={stepperButton({ size })}
        onClick={() => {
          onChange(value + 1)
        }}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  )
}
