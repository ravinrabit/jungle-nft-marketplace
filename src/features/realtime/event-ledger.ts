const MAX_REMEMBERED_EVENTS = 500

interface VersionedEvent {
  eventId: string
  version: number
  resource: { type: string; id: string }
}

export class EventLedger {
  readonly #seenEventIds = new Set<string>()
  readonly #versions = new Map<string, number>()

  accept(event: VersionedEvent) {
    if (this.#seenEventIds.has(event.eventId)) {
      return false
    }
    this.#remember(event.eventId)

    const key = `${event.resource.type}:${event.resource.id}`
    const known = this.#versions.get(key)
    if (known !== undefined && event.version <= known) {
      return false
    }
    this.#versions.set(key, event.version)
    return true
  }

  #remember(eventId: string) {
    this.#seenEventIds.add(eventId)
    if (this.#seenEventIds.size > MAX_REMEMBERED_EVENTS) {
      const [oldest] = this.#seenEventIds
      if (oldest !== undefined) {
        this.#seenEventIds.delete(oldest)
      }
    }
  }
}
