import * as React from 'react'
import { cn } from '@/shared/lib/cn'
import { Slider as SliderPrimitive } from 'radix-ui'

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  thumbLabels?: readonly string[]
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels = [],
  ...props
}: SliderProps) {
  const values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex h-[1.3125rem] w-full touch-none items-center select-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1 w-full grow overflow-hidden bg-primary"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={thumbLabels[index]}
          className="block size-[0.9375rem] shrink-0 cursor-grab rounded-full border-[3px] border-primary bg-ink transition-shadow focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none active:cursor-grabbing disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
