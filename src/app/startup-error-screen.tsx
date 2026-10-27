interface StartupErrorScreenProps {
  onRetry: () => void
}

export function StartupErrorScreen({ onRetry }: StartupErrorScreenProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-bold">Não foi possível iniciar a demonstração</h1>
      <p role="alert" className="text-text-secondary">
        O ambiente simulado depende de Service Workers, que estão bloqueados neste navegador. Abra a
        aplicação em um navegador atualizado, fora do modo de navegação restrita, e tente novamente.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-sm bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary-light"
      >
        Tentar novamente
      </button>
    </main>
  )
}
