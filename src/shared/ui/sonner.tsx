import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4 text-success" />,
      info: <InfoIcon className="size-4 text-text-accent" />,
      warning: <TriangleAlertIcon className="size-4 text-amber" />,
      error: <OctagonXIcon className="size-4 text-text-coral" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    style={
      {
        '--normal-bg': 'var(--kurio-surface-card)',
        '--normal-text': 'var(--kurio-foreground)',
        '--normal-border': 'var(--kurio-border)',
        '--border-radius': '6px',
      } as React.CSSProperties
    }
    {...props}
  />
)

export { Toaster }
