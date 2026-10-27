import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="py-24">
      <p className="text-sm font-medium tracking-[0.1em]">Bem-vindo à Kurio</p>
      <h1 className="mt-4 text-[2.6875rem] leading-[4.375rem] font-bold uppercase">
        Seja dono do futuro da arte digital
      </h1>
    </section>
  )
}
