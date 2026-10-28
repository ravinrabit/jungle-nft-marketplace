import { toast } from 'sonner'

export function notifyUnavailableFeature(feature: string) {
  toast.info(`${feature} não faz parte desta demonstração.`, {
    id: `unavailable-${feature}`,
  })
}
