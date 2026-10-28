const STORAGE_KEY = 'kurio:session-token'

export const sessionToken = {
  read(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  },
  write(token: string) {
    try {
      localStorage.setItem(STORAGE_KEY, token)
    } catch (error) {
      console.warn('Não foi possível salvar a sessão neste navegador', error)
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Não foi possível remover a sessão deste navegador', error)
    }
  },
}
