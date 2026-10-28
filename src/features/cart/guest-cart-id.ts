const STORAGE_KEY = 'kurio:guest-cart-id'

export const guestCartId = {
  read(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  },
  ensure(): string {
    const existing = guestCartId.read()
    if (existing) {
      return existing
    }
    const created = crypto.randomUUID()
    try {
      localStorage.setItem(STORAGE_KEY, created)
    } catch (error) {
      console.warn('Não foi possível guardar o carrinho de visitante', error)
    }
    return created
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Não foi possível limpar o carrinho de visitante', error)
    }
  },
}
