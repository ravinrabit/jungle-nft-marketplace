import { FacebookIcon } from '@/shared/ui/brand-icons'
import { ComingSoonBadge } from '@/shared/ui/coming-soon'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5">
      <path
        fill="#4086F4"
        d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.9a5.04 5.04 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.07z"
      />
      <path
        fill="#59C36A"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.05-3.74 1.05-2.87 0-5.31-1.94-6.18-4.55H2.17v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FFDA2D"
        d="M5.82 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.17a11 11 0 0 0 0 9.86l3.65-2.84z"
      />
      <path
        fill="#FF641A"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.17 7.07l3.65 2.84C6.69 7.32 9.13 5.38 12 5.38z"
      />
    </svg>
  )
}

const SOCIAL_BUTTON =
  'flex h-10 w-full cursor-not-allowed items-center justify-center gap-3 rounded-[0.3125rem] border border-border text-[0.8125rem] leading-4 font-medium text-text-secondary opacity-60'

export function SocialSignIn() {
  return (
    <div className="flex flex-col gap-3 lg:pt-6">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="text-[0.8125rem] leading-4 text-foreground">Ou continue com</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-col gap-4 lg:gap-3 lg:px-20">
        <button type="button" disabled className={SOCIAL_BUTTON}>
          <GoogleMark />
          Continuar com Google
          <ComingSoonBadge />
        </button>
        <button type="button" disabled className={SOCIAL_BUTTON}>
          <FacebookIcon className="size-5 text-logo-facebook" />
          Continuar com Facebook
          <ComingSoonBadge />
        </button>
      </div>
    </div>
  )
}
