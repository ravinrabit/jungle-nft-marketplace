import { useSyncExternalStore } from 'react'

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'unavailable'

let current: RealtimeStatus = 'idle'
const listeners = new Set<() => void>()

export const realtimeStatus = {
  get: () => current,
  set: (next: RealtimeStatus) => {
    if (next === current) {
      return
    }
    current = next
    for (const listener of listeners) {
      listener()
    }
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useRealtimeStatus() {
  return useSyncExternalStore(realtimeStatus.subscribe, realtimeStatus.get)
}
