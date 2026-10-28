import { WifiOff } from 'lucide-react'
import { useRealtimeStatus } from '@/shared/realtime/realtime-status'

const MESSAGES = {
  reconnecting: 'Atualizações em tempo real desconectadas. Reconectando…',
  unavailable: 'Atualizações em tempo real indisponíveis. Tentando conectar novamente…',
} as const

export function RealtimeStatusNotice() {
  const status = useRealtimeStatus()
  const message = status === 'reconnecting' || status === 'unavailable' ? MESSAGES[status] : null

  return (
    <div role="status" aria-live="polite" className="pointer-events-none">
      {message && (
        <p className="fixed bottom-28 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-full border border-amber/50 bg-surface-card/95 px-4 py-2 text-xs leading-4 text-foreground shadow-lg backdrop-blur-md lg:bottom-6 lg:left-6 lg:translate-x-0">
          <WifiOff aria-hidden="true" className="size-4 shrink-0 text-amber" />
          {message}
        </p>
      )}
    </div>
  )
}
